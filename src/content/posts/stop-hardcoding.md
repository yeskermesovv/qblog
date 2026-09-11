---
title: "Put it in the database, not in the Java"
description: "Hardcoded values turn every business decision into a deploy. Where to draw the line between what belongs in code and what belongs in a table."
pubDatetime: 2026-09-12T01:55:00+05:00
tags:
  - backend
  - databases
---

Someone from finance asks to change the late payment fee from 5% to 4%. The number
lives in a constant. You open a branch, change one character, open a pull request, wait
for review, wait for CI, wait for the release window, and two days later finance has
their 4%.

Nothing about that is engineering. It is a business decision that got trapped inside
an artifact that only engineers can change.

## Table of contents

## The line worth drawing

The useful distinction is not "config versus code". It is **who owns the decision**.

If the business can change their mind about a value without anyone rewriting logic, that
value is data, and data belongs in a table. If changing it means rewriting what the system
actually does, it is code.

A fee percentage is data. How the fee is calculated is code. The list of supported
currencies is data. The routine that converts between them is code. A limit of three
login attempts is data. Locking the account after the limit is code.

Apply this once across a codebase and a surprising amount of it turns out to be data
hiding in Java syntax.

## The constants that should have been rows

```java
public class FeePolicy {
    private static final BigDecimal LATE_FEE = new BigDecimal("0.05");
    private static final int MAX_LOGIN_ATTEMPTS = 3;
    private static final Set<String> SUPPORTED_COUNTRIES = Set.of("KZ", "RU", "GE");
}
```

Every one of these is a decision someone outside engineering owns, and every one costs a
deploy to change. The table version:

```sql
create table app_setting (
    key         text primary key,
    value       text        not null,
    updated_at  timestamptz not null default now(),
    updated_by  text        not null
);
```

You get an audit trail for free, which the constant never gave you. When somebody asks in
six months why the fee changed in March, the answer is a query rather than an archaeology
expedition through git blame.

Read it through a cached service so you are not hitting the database on every request:

```java
@Service
public class SettingService {

    @Cacheable(value = "settings", key = "#key")
    public String get(String key) {
        return repository.findById(key)
            .map(AppSetting::getValue)
            .orElseThrow(() -> new MissingSettingException(key));
    }

    @CacheEvict(value = "settings", key = "#key")
    public void set(String key, String value, String actor) { ... }
}
```

Give the cache a short time to live rather than relying only on eviction, since another
instance or a manual SQL update will not fire your eviction.

## The enum problem

This is the one that bites hardest in Java, because enums feel like the right tool.

```java
public enum OrderStatus { NEW, PAID, SHIPPED, CANCELLED }
```

Then operations wants a `REFUNDED` status. That is a deploy, a migration of whatever
column stores it, and a coordinated release. For a word.

The distinction from earlier applies cleanly here. If the code does this:

```java
switch (status) {
    case PAID -> chargeCard();
    case SHIPPED -> notifyCourier();
}
```

then the enum is behavior and it belongs in Java, because adding a value genuinely requires
writing the branch that handles it. But if the status is only ever displayed, filtered on,
or reported, it is a lookup table with a foreign key, and operations can add rows to it
without you.

Most status enums in most codebases are the second kind wearing the clothes of the first.

## The strongest argument: you are not the only writer

Everything above is about deploy speed. This part is about correctness, and it is the
better reason.

A rule you enforce in Java protects exactly one path into the data: your application. The
moment a second service, a batch job, a data migration or somebody with psql touches that
table, your rule is not enforced at all.

```java
if (order.getQuantity() <= 0) {
    throw new IllegalArgumentException("quantity must be positive");
}
```

That validation is worth having for the error message. It is worth nothing as a guarantee.
This is the guarantee:

```sql
alter table order_item
    add constraint quantity_positive check (quantity > 0);
```

The same goes for uniqueness, which people reimplement in Java constantly:

```java
if (userRepository.existsByEmail(email)) {
    throw new DuplicateEmailException();
}
userRepository.save(user);
```

Two concurrent requests both pass the check and both insert. The race is real and it
happens in production under load. A unique index makes it impossible rather than unlikely,
and you catch the constraint violation to produce the nice error message.

Foreign keys, not null, check constraints, unique indexes. Every one of them is a rule
that holds no matter who writes, including the script somebody runs at two in the morning.

## Where this stops

"Use the database as much as possible" has a real limit, and it is worth naming so the
advice does not turn into its own mess.

**Business logic in stored procedures is not the same idea.** Putting the fee value in a
table is good. Putting the fee calculation in PL/pgSQL is a different decision with a
different bill: harder to unit test, harder to review, invisible to your IDE, and it lives
outside the deployment pipeline that gives you rollbacks. Data and constraints in the
database, algorithms in the application.

**Configuration in the database still needs migrations.** Seed rows belong in Flyway or
Liquibase alongside the schema, otherwise a fresh environment comes up missing settings
that only exist in production because someone inserted them by hand.

**You are trading compile-time safety for runtime flexibility.** A constant that does not
exist fails the build. A setting key that does not exist fails at request time, in front
of a user. Pay for that trade with a startup check that asserts every required key is
present, so the failure lands at deploy rather than at midnight.

**Not everything needs the ceremony.** A retry count used in one class, owned by
engineering, that nobody has ever asked to change, is fine as a constant. The question is
always whether someone outside the team owns the decision.

## A rule of thumb

| Put it in | When |
| --- | --- |
| Java constant | Engineering owns it and it changes only with the logic around it |
| Config file | Differs per environment, changes on deploy, not secret |
| Database row | The business owns it and wants it changed without you |
| Database constraint | It must be true regardless of who writes the data |

The test I use: if changing this value requires me to think, it is code. If it requires me
only to type, it should have been a row.
