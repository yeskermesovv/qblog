---
title: "Your connection pool is smaller than you think"
description: "Why calling an HTTP API inside a database transaction takes down services that have nothing to do with that API."
pubDatetime: 2026-09-12T01:30:00+05:00
tags:
  - backend
  - databases
---

Here is a method that looks completely reasonable and will eventually take your
service down.

```java
@Transactional
public void placeOrder(OrderRequest req) {
    Order order = orderRepository.save(new Order(req));
    paymentClient.charge(req.card(), order.total());   // HTTP
    inventoryClient.reserve(order.items());            // HTTP
    notificationClient.sendReceipt(order.id());        // HTTP
    order.setStatus(CONFIRMED);
}
```

It passes review. It passes tests. It works fine until the day the payment provider
gets slow, and then your order service goes down, and so does your profile page, your
search, and your health check.

## Table of contents

## The pool is the whole story

A connection pool is a small, fixed set of open database connections. HikariCP defaults
to ten. Most teams never change it, and that is usually correct, because a database
handles far fewer concurrent connections well than people expect.

Ten is not a typo and it is not stingy. It is roughly the right number for a machine with
a handful of cores. Connections are expensive on the database side, and past a point more
of them make throughput worse, not better.

The rule that matters: **an open transaction holds its connection from BEGIN to COMMIT.**
Not while a query runs. The entire time. Every millisecond you spend inside a transaction
doing something that is not a database query is a millisecond that a pooled connection sits
idle, held, and unavailable to anyone else.

## The arithmetic

Say the three HTTP calls above normally take 200ms in total. Ten connections, 200ms each,
gives you roughly fifty orders per second. Tight but survivable.

Now the payment provider degrades and its p99 goes to three seconds. Your code has a
five second timeout, because someone sensibly set one.

| Transaction duration | Throughput with 10 connections |
| --- | --- |
| 200 ms | 50 / sec |
| 3 s | 3.3 / sec |
| 5 s (timeout) | 2 / sec |

Throughput falls by a factor of twenty five. Requests queue for a connection. The queue
has its own timeout, so callers start getting connection pool exhausted errors.

Here is the part that surprises people. Those errors are not limited to the order endpoint.
Every endpoint in the application draws from the same pool. Your user profile lookup, a
single indexed select that takes two milliseconds, now fails, because all ten connections
are parked waiting on a payment provider it has never heard of.

One slow third party just became a full outage. That is the actual failure mode, and it is
why this is worth caring about beyond tidiness.

## Locks make it worse

The connection is only the first resource you are holding. The transaction is also holding
row locks, and it holds them for the same three to five seconds.

Anything that touches those rows now blocks behind your HTTP call. If two requests grab the
same rows in different orders, you get a deadlock that the database resolves by killing one
of them. Under load this turns into a retry storm, which adds load, which makes everything
slower.

The longer a transaction lives, the more the database has to keep old row versions around
for it, and the more work vacuum has to do later. Long transactions are expensive in ways
that do not show up until they are a habit.

## Atomicity across systems is a lie

There is a deeper problem, and it survives even if the network were instant.

A database transaction can roll back a database write. It cannot roll back an HTTP call.
If the payment succeeds and the transaction then fails on commit, you charged the customer
and have no order. The illusion that wrapping everything in `@Transactional` makes it atomic
is exactly backwards: it gives you a guarantee on the cheap part and nothing at all on the
part that involves real money.

## What to do instead

**Keep transactions to database work only.** Do the API calls before the transaction, or
after it. Read what you need, close the transaction, call the outside world, open a new
short transaction to write the result. Two short transactions beat one long one every time.

**Use an outbox when a write must cause a call.** Write the row and an outbox record in the
same transaction, commit, and let a separate worker read the outbox and make the HTTP call.
The database write and the intent to call are atomic together, the call itself is retried
independently, and no connection is held while it happens.

**Make the calls idempotent.** Once retries exist, the same charge will be attempted twice.
An idempotency key on the request is what stops that from being a second charge.

**For multi-step workflows, use compensating actions.** If reserving inventory fails after
the payment succeeded, you issue a refund. That is a saga, and it is more work than
`@Transactional`, but it is the only thing that is actually true across service boundaries.

**Put a ceiling on it in the database.** Set `statement_timeout` and, more importantly,
`idle_in_transaction_session_timeout`. The second one specifically kills transactions that
are sitting open doing nothing, which is precisely the shape of this bug. It converts a
silent outage into a loud error with a stack trace.

**Consider separate pools.** A background job that runs long queries should not share a pool
with request handling. Splitting them means a slow report cannot starve your API.

## The smell to look for

You do not need to profile anything to find these. Search the codebase for classes annotated
`@Transactional` and look for an HTTP client, a message publisher, a cloud SDK call, or a
`Thread.sleep` inside them.

Anything that talks over a network inside a transaction is a connection held hostage by a
system you do not control. That is the whole lesson, and it is worth an afternoon of grepping.
