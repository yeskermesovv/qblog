---
title: "Fixing Kafka consumer lag in Spring Boot"
description: "What consumer lag actually measures, the handful of things that really cause it, and the Spring Kafka settings that fix each one."
pubDatetime: 2026-09-12T01:45:00+05:00
tags:
  - backend
  - kafka
---

Consumer lag is the number of messages sitting between the last offset written to a
partition and the last offset your consumer group committed. Per partition, always.
The group lag people quote in dashboards is just the sum.

The single most common mistake is treating lag as a number that should be zero. It
should not. A healthy consumer sits at some small non-zero lag, because messages keep
arriving. What matters is the derivative. Flat lag means you are keeping up. Rising
lag means you are not, and it will keep rising until something breaks.

## Table of contents

## Read the lag before you fix it

The command line tool tells you which partitions are actually behind, which the group
total hides completely:

```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group order-processor
```

Look at the per-partition `LAG` column and the `CONSUMER-ID` column together. Three
patterns, three completely different problems:

| What you see | What it means |
| --- | --- |
| Lag spread evenly across all partitions | Consumers are simply too slow |
| Lag on one or two partitions only | Key skew, one hot partition |
| Partitions with no consumer assigned | Fewer consumers than partitions, or a stuck rebalance |

In the application itself, the Kafka client exposes `records-lag-max` on the consumer
fetch manager over JMX, and Micrometer republishes it if you have Actuator on the
classpath. Alert on that going up over fifteen minutes, not on it crossing a fixed
threshold. Absolute thresholds page you during every deploy and stay silent during the
slow leak that actually matters.

## Parallelism has a hard ceiling

Within one consumer group, a partition is consumed by exactly one consumer. That means
**your maximum parallelism is the partition count**, and nothing you configure changes it.

In Spring Boot the knob is:

```yaml
spring:
  kafka:
    listener:
      concurrency: 6
```

That starts six consumer threads in the container. Set it to twelve on a six partition
topic and six threads sit idle forever, holding assignments they never receive. Set it
to three and each thread handles two partitions.

So the ordering of fixes is: match concurrency to partitions first, and only add
partitions when the consumers are genuinely saturated. Adding partitions is not free
either, since it changes key to partition mapping and breaks ordering guarantees for
keys that move.

## The slow listener problem

Most lag is not a Kafka problem. It is a listener that takes 80ms per message because
it makes a database round trip and an HTTP call, and no amount of broker tuning fixes
arithmetic.

At 80ms per record, one thread does 12 records per second. Six threads do 75. If the
topic receives 500 per second, you are falling behind by 425 every second, forever.

Two things help, and they compose.

**Process in batches.** Instead of one record at a time, take the whole poll:

```yaml
spring:
  kafka:
    listener:
      type: batch
    consumer:
      max-poll-records: 500
```

```java
@KafkaListener(topics = "orders", groupId = "order-processor")
public void handle(List<ConsumerRecord<String, Order>> records) {
    List<Order> orders = records.stream().map(ConsumerRecord::value).toList();
    orderRepository.saveAll(orders);   // one round trip, not 500
}
```

Five hundred single row inserts become one batch insert. This is usually worth an order
of magnitude on its own, and it is the first thing to try.

**Get the blocking calls out of the listener.** The same rule from
[the transactions post](/qblog/posts/apis-inside-transactions/) applies here. An HTTP
call inside the listener means the partition advances at the speed of someone else's
service. If the call must happen, batch it or move it behind a queue of your own.

## Rebalance thrash

This one produces the strangest graphs: lag that spikes, drops, spikes again, while
throughput looks fine.

The consumer must call `poll()` at least every `max.poll.interval.ms`, which defaults to
five minutes. Take longer and the broker assumes the consumer is dead, kicks it out, and
triggers a rebalance. Every consumer in the group stops, reassigns, and re-reads. Then
the same slow batch times out again and the cycle repeats.

You are then permanently rebalancing and never committing. The fix is almost never to
raise the interval. It is to make the batch smaller so it finishes in time:

```yaml
spring:
  kafka:
    consumer:
      max-poll-records: 100
      properties:
        max.poll.interval.ms: 300000
```

Pick `max-poll-records` so that worst case processing time stays comfortably under the
interval. If one batch of 500 takes four minutes at p99, you are one slow day away from
a rebalance loop.

## The poison pill

A single record that always throws will block its partition forever. The container
retries, fails, retries, and the offset never advances while everything behind it queues
up. Lag on one partition climbs in a straight line.

Blocking retries make it worse, because they stall the partition for the entire retry
sequence. Use non-blocking retries, which send the record to a delay topic and let the
main partition move on:

```java
@RetryableTopic(
    attempts = "4",
    backoff = @Backoff(delay = 1000, multiplier = 2.0),
    dltStrategy = DltStrategy.FAIL_ON_ERROR
)
@KafkaListener(topics = "orders", groupId = "order-processor")
public void handle(Order order) { ... }
```

And configure a dead letter destination so that anything genuinely unprocessable leaves
the stream instead of holding it:

```java
@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    return new DefaultErrorHandler(
        new DeadLetterPublishingRecoverer(template),
        new FixedBackOff(0L, 2)
    );
}
```

A message you cannot process is not worth an outage. Park it in a dead letter topic,
alert on that topic being non-empty, and keep the partition moving.

## Committing less often

By default Spring Kafka commits after each batch returned by the poll, which is
reasonable. Committing after every single record is not, and it is a common accidental
setting:

```yaml
spring:
  kafka:
    listener:
      ack-mode: batch   # not RECORD
```

Each commit is a network round trip to the group coordinator. Doing that per record adds
a few milliseconds to every message, which at high volume is the difference between
keeping up and not.

## Key skew

If lag sits on one partition while the rest are clean, your partition key is the problem.
One tenant, one merchant, one device produces most of the traffic, and everything with
that key lands on the same partition by definition.

No consumer setting fixes this, because ordering by key is the guarantee you asked for.
Either change the key to something with higher cardinality and accept weaker ordering,
or give the hot key its own topic with its own consumers.

## The order to work through

1. Look at per-partition lag and find out which of the shapes above you have.
2. Check for rebalances in the logs before tuning anything else, since they invalidate every other measurement.
3. Match `concurrency` to the partition count.
4. Switch to batch listeners and batch your database writes.
5. Get network calls out of the listener.
6. Only then add partitions.

Most of the time it stops at step four.
