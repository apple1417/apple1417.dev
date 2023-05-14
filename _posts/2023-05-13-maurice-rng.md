---
title: Why BL3's Maurice Vendor RNG Sucks
latex: true
---

Maurice's Black Market is a vendor which spawns in a random location each week, selling a selection
of legendary items. Speedruns were using one particular week to get an overpowered gun, but there
was a question hanging in the air: is there a week we can get it somewhere better? It turns out, no,
the RNG is horribly flawed.

# Selection Logic
I'll leave out the boring details on how exactly I reverse engineered it, that's not what this post
is about. A python recreation of the logic is [available here](https://gist.github.com/apple1417/8f1664daa3b2fca3d8705d964a3ce603)
\- I'll be copying some snippets from it later.

So broad overview of how it works. There are 52 item pools and 66 locations to choose from. To get a
seed, it simply works out the number of weeks since 1999-02-18 (the Thursday after Gearbox was
founded, incidentally). There's a weird little extra bit of logic about what time exactly it rolls
over, but we don't need to concern ourselves with that. To make sure it picks every option once
before repeating, it works out the last multiple of 52 (or 66), and back-calculates what entries it
picked the previous weeks and removes them from the list. It then just does a basic random index to
picks the current week's entry.

# First Signs of a Problem
Once I'd recreated the logic, I started just running some brute force tests - for every week, are
the pool and location acceptable? In particular, we wanted to see if we could get the Hellwalker
item pool (`ItemPool_BMV_Week30`) somewhere on Pandora 1 (`Zone_0`). No results in 1,000 weeks.
10,000? None. 100,000? 10,000,000? Nothing. 9999-12-31 is week 417,465. Unreal's date representation
(u64 of 100ns ticks since 0000-01-01) caps out at approximately week 3,000,000. Three times that,
and still no results.

I next just dumped some results pinning one of the entries. Between weeks 1200-2200, the last
location, `Desolate` + `_3`, rolls alongside these pools.

```
1207: ItemPool_BMV_Week52
1284: ItemPool_BMV_Week45
1361: ItemPool_BMV_Week51
1438: ItemPool_BMV_Week52
1453: ItemPool_BMV_Week43
1535: ItemPool_BMV_Week47
1612: ItemPool_BMV_Week52
1689: ItemPool_BMV_Week52
1766: ItemPool_BMV_Week42
1838: ItemPool_BMV_Week51
1858: ItemPool_BMV_Week45
1935: ItemPool_BMV_Week52
2012: ItemPool_BMV_Week45
2089: ItemPool_BMV_Week51
2166: ItemPool_BMV_Week52
2181: ItemPool_BMV_Week43
```

Those numbers are awfully close together. In the same time range, the last pool,
`ItemPool_BMV_Week52`, rolls alongside these locations.

```
1207: Desolate + _3
1279: Desolate + _0
1341: Crypt + _0
1366: MotorcadeFestival + _1
1438: Desolate + _3
1500: Desolate + _1
1530: Crypt + _0
1597: Desolate + _1
1612: Desolate + _3
1689: Desolate + _3
1756: Desolate + _0
1776: Motorcade + _1
1848: Desolate + _1
1915: Crypt + _3
1935: Desolate + _3
2007: Desolate + _0
2069: Crypt + _0
2094: MotorcadeFestival + _1
2166: Desolate + _3
```

You need a little more game (+ modding) knowledge to tell, but again this is picking a lot of maps,
and locations within those maps, which are very close together.

Checking across far larger date ranges, the pattern continues - though it does appear to, very
slowly over hundreds of years, drift down through the list. Why will there never be a Hellwalker in
a Pandora 1 vendor? Because somehow, these two "independent" random variables are locked in a very
tight resonance.

# Historical Data
Now before I go ahead and reveal the answer, here's another interesting pattern I found after
working it out. Mental Mars has been listing all the [historical vendor locations here](https://mentalmars.com/guides/maurices-black-market-location-guide-borderlands-3/).
Note that week 32 and earlier were all manually placed by gearbox in weekly hotfixes - they won't
line up with what the RNG predicts.

So the specific thing I want to draw attention to is the maps picked in weeks 80-109. Scrolling
through them linearly, it seems pretty random. But watch what happens when I plot them on a grid.

| Week |    0 mod 5    |    1 mod 5    |    2 mod 5    |    3 mod 5    |    4 mod 5    |
|-----:|:-------------:|:-------------:|:-------------:|:-------------:|:-------------:|
|   80 | Carnivora     | Skywell       | Devil’s       | Ascension     | Anvil         |
|   85 | Tazendeer     | Skywell       | Devil’s       | Ascension     | Anvil         |
|   90 | Tazendeer     | Skywell       | Devil’s       | Atlas HQ      | Estate        |
|   95 | Tazendeer     | Outskirts     | Splinterlands | Arterial      | Floodmoor     |
|  100 | Tazendeer     | Skywell       | Devil’s       | Atlas HQ      | Anvil         |
|  105 | Tazendeer     | Outskirts     | Cathedral     | Atlas HQ      | Anvil         |

Incidentally, week 100 was the start of a new 66-week location cycle, which is why old locations can
repeat again, helping make this pattern stand out as much as it does.

This same pattern exists for item pools, but it's harder to notice without generating the results
yourself.

# Investigating
So our randomness isn't being very random. Let's make sure Gearbox isn't using it wrong.

## Picking Random Entries
We know the game makes sure to use every location/pool once before repeating. Is this selection
logic introducing bias?

```py
def _pick_from_arr(week: int, arr: tuple) -> str:
    arr_copy = list(arr)
    for i in range(week - (week % len(arr)), week):
        arr_copy.pop(int(srand_once(i) * len(arr_copy)))

    return arr_copy[int(srand_once(week) * len(arr_copy))]
```

Rather than thinking about this back-calculating results, we can rearrange it a bit to think about
it sequentially.

```py
yield arr.pop(int(srand_once(n + 0) * len(arr)))
yield arr.pop(int(srand_once(n + 1) * len(arr)))
yield arr.pop(int(srand_once(n + 2) * len(arr)))
...
```

Each week, we have an array of a certain size. We get the week's seed, use it to pick a random
value, multiply it by the size, and use that as an index. Assuming we have a fairly picked random
number, any index is going to be equally likely to be chosen. We then remove that entry from the
list, and return it from that week. On a week by week basis, there's obviously a bit of bias here -
you can't get the same entry two weeks in a row (unless it happens to be on the edge of a cycle).
But this is just standard selection without replacement. On the macro scale however, across two or
more cycles, you'd expect any entry to be equally likely to any other. This means when we combine
the two independent variables, location and item pool, we shouldn't be seeing patterns.

## The Random Number Generator
If it's not the selection algorithm biasing our results, is it the RNG?

```py
def srand_once(seed: int) -> float:
    x = (seed * 0xbb38435 + 0x3619636b) & 0xFFFFFFFF
    x = x & 0x7fffff | 0x3f800000
    f = struct.unpack(">f", struct.pack(">I", x))[0]
    return f - int(f)
```

This starts with a pretty standard linear congruential generator. A quick google shows it's the same
constants as those used in the OPUS audio codec ([RFC6716 pg 98](https://www.rfc-editor.org/rfc/rfc6716))
\- so they're probably fine, we can assume it gives us fair random numbers.

It then masks out the top 9 bits, and forces them to `0x3f800000`, before re-interpreting the value
as a float. The masking sets the sign to positive and the exponent to $$2^0$$, and leaves the
mantissa to the random bits. This means we're down to just 23 bits of randomness, but it doesn't
introduce any bias in and of itself. Interpreting it as a float thus gives us a value fairly
distributed over the range $$[1.0, 2.0)$$.

Finally, it subtracts the integer portion of the float from itself. This will really always just be
a constant subtract 1. It's not immediately obvious, but this operation is guaranteed not to lose
any precision. The implicit 24th mantissa bit must always be set, and since subtracting 1 will clear
it, the mantissa simply gets left shifted until the most significant set bit ends up in that 24th
slot (and the exponent gets adjusted accordingly). So this conversion does not add any bias either,
we will get a fairly picked random number in the range $$[0.0, 1.0)$$.

# The Problem
So it's not how we're picking entries from the list, and it's not the RNG. You've probably already
worked out the problem - it's how they combine.

While a linear congruential generator outputs a perfectly fine stream of random numbers, it needs to
keep advancing it's internal state to do so - usually done by keeping it as a private static. If you
seed the state the same, it produces the same stream of numbers - the very definition of a PRNG.

Like the name of my python re-implementation implies, the problem is that they only call `SRand()`
once. They then immediately call `SRandInit(seed)`, which throws away how the state advanced. And
what are they re-seeding it with? The last seed plus one.

$$
\begin{align*}
SRandOnce(w)     &= Aw + C              &\mod &M \\
\\
SRandOnce(w + 1) &= A(w + 1) + C        &\mod &M \\
                 &= Aw + C + A          &\mod &M \\
                 &= SRandOnce(w) + A    &\mod &M
\end{align*}
$$

By only calling `SRand()` once, with incrementing seeds, all they're doing is incrementing the
result by $$ A \mod M $$ each time. What does this mean with our numbers?

Assume $$ SRandOnce(w) = 0 $$.

$$
\begin{align*}
SRandOnce(w + 1) &= A &\mod &M \\
                 &= \mathtt{BB38435}_{16} &\mod &\mathtt{FFFFFFFF}_{16} \\
                 &= \mathtt{BB38435}_{16}
\end{align*}
$$

Since we know the sign is positive and the exponent is $$2^0$$, we only need to care about the
mantissa.

$$
\begin{align*}
\mathtt{BB38435}_{16} \mathbin{\&} \mathtt{7FFFFF}_{16} &= [\mathtt{1}.]\mathtt{338435}_{16} \\
                                                        &= 1.4024721384_{10} \\
\\
1.4024721384_{10} - \lfloor1.4024721384_{10}\rfloor     &= 0.4024721384_{10}
\end{align*}
$$

For completeness, we can also work out the constant offset, which we'll see week 0.

$$
\begin{align*}
SRandOnce(0) = C \mod M                                  &= \mathtt{3619636B}_{16} \\
\\
\mathtt{3619636B}_{16} \mathbin{\&} \mathtt{7FFFFF}_{16} &= [\mathtt{1}.]\mathtt{19636B}_{16} \\
                                                         &= 1.19834649563_{10} \\
\\
1.19834649563_{10} - \lfloor1.19834649563_{10}\rfloor    &= 0.19834649563_{10}
\end{align*}
$$

## 5 Week Pattern
Remember that 5 week pattern? Every week gets a random index approximately 40% further through the
list than the last, so generally, after 5 weeks the game will pick an entry immediately adjacent to
the one it picked last time. And because the lists are ordered, the adjacent location is typically
on the same or on an adjacent map. The exact same happens with item pools, but it's harder to
notice.

Now this isn't a perfect rule. It isn't a perfect 40% increment so sometimes enough error builds up
to jump two indexes instead of one, and when the 52/66 week cycles reset there can be even larger
ones. We can even see some of these in the example grid. But in the majority of cases, the rule will
work fine.

## Macro Scale Pattern
So what about the longer term pattern, across hundreds of years, when you pin a location/item pool?

There's another relatively simple cause contributing to this: the item pool and location simply are
*not* independent. They're both generated using the exact same seed, so they both get the exact
random float. If the two arrays were the same size, they'd always pick the exact same index, the
only reason there's any variation is because they're different.

The two size cycles line back up after $$ \DeclareMathOperator{\lcm}{lcm} \lcm(52, 66) = 1716 $$
weeks. This actually removes half of all possible variation to begin with, $$ \gcd(52, 66) = 2 $$.
But this is still far more variation than what we're seeing. To continue reasoning about it, let's
move to a smaller scale example, with 4 and 6 entries. Let's consider splitting the range
$$ [0.0, 1.0) $$ into 60 parts. Based on the array size, we'll pick indexes as follows.
```
    0         10        20        30        40        50
    -----=====-----=====-----=====-----=====-----=====-----=====
6 | 000000000011111111112222222222333333333344444444445555555555
5 | 000000000000111111111111222222222222333333333333444444444444
4 | 000000000000000111111111111111222222222222222333333333333333
3 | 000000000000000000001111111111111111111122222222222222222222
2 | 000000000000000000000000000000111111111111111111111111111111
1 | 000000000000000000000000000000000000000000000000000000000000
```

Given two sizes, we can pick those two rows, and picking a random float is equivalent to picking a
random column and reading off it's indexes. For example, if we rolled 40/60, we can come up with the
following possible index pairs.

| A Size | Index Pairs            |
|-------:|:-----------------------|
|      4 | (2, 4), (2, 2), (2, 1) |
|      3 | (2, 3), (2, 2), (2, 0) |
|      2 | (1, 4), (1, 2), (1, 1) |
|      1 | (0, 3), (0, 2), (0, 0) |

Note half the pairs are missing because $$ \gcd(4, 6) = 2 $$, same as in our large range. But we're
not really interested in this table. What we actually care about is just the fact that, regardless
of circumstance, there are only ever 60 different ranges a float can fall into and make a meaningful
difference. We could do the same to our full range, split it into some far larger number of columns,
where picking a random column would always be equivalent to picking a random float.

Now let's bring back the constant increment. If it were a perfect 0.4, it's trivial to see that we'd
only ever pick 5 columns - regardless of the array sizes. If we pin A, this results in a 20 week
cycle, so we can quickly dump them all:

```py
As = ("a", "b", "c", "d")
Bs = ("u", "v", "w", "x", "y", "z")

def pick_perfect_0_4(week: int, arr: tuple) -> str:
    def rng(week: int) -> float:
        return (0.4 * week) % 1
    arr_copy = list(arr)
    for i in range(week - (week % len(arr)), week):
        arr_copy.pop(int(rng(i) * len(arr_copy)))
    return arr_copy[int(rng(week) *  len(arr_copy))]

selected_a = [pick_perfect_0_4(week, As) for week in range(20)]
selected_b = [pick_perfect_0_4(week, Bs) for week in range(20)]
filtered_b = [selected_b[week] if selected_a[week] == "b" else " " for week in range(20)]
print("".join(selected_a) + "\n" + "".join(filtered_b) + "\n" + "".join(selected_b))
```
```
acdbcabdacbddacbbdac
   v  w   v    uw
uxzvywwzuxvyyvxuwzvy
```

Look familiar? If we weren't removing picked entries, we'd always get `b` from column 24, which
would always correspond 1-1 with `w`. But since we are removing entries, the first time we pick it
in week 3, we're in column 12, and the B array is down to just `vwy`, so we end up with `v` instead.
Removing picked entries adds noise, the amount of which is relative to the inverse of how many
entries are left.

So if we get a lot more noise when there are only a few entries left in the array, why didn't we see
it picking anything further out when looking at `ItemPool_BMV_Week52` back at the beginning? Because
the order each entry is picked is also relatively constant. If we're looking for an entry 3 indexes
away from one of the "center lines" we'd pick at the start of the cycle, it will always take 15
weeks after picking the center line's entry, or 15-20 weeks from the start. This isn't a perfect
rule again, epecially for the later entries, sometimes it's a few more 5-week cycles out. But it
still means, generally, an entry which appears at the start of a cycle will continue to appear near
the start of following ones - and thus will continue to have relatively low noise. Where does our
example appear? About week 30.

The last thing to explain is the drift. This is relatively simple: we've been assuming everything
increments by exactly 0.4, when in fact there's a slight error. It takes 405 weeks for the error to
grow larger than 1. Because the error applies to both the item pool and location equally, we need to
include their array size cycles alongside this new 405 week cycle, for a total length of
$$ \DeclareMathOperator{\lcm}{lcm} \lcm(52, 66, 405) = 231660 $$ weeks to get back to the start. Of
course, the error isn't exactly $$ \frac{1}{405} $$, so we could delve even deeper until it actually
resets to 0. But this value already tells us what we want: if it takes 231,660 weeks for the
locations' center points to cycle though all 66 indexes (given a fixed item pool), advancing just
one will take $$ \frac{231660}{66} = 3510 $$ weeks. And remember that we easily have 5-10 indexes
worth of noise, so it takes even longer to become recognisable.

# Conclusion
So to summarize our findings: The game puts an incrementing random seed through a linear
congruential generator, and only calls it once before re-seeding. This removes the randomness,
turning it into just a linear function, always spitting out a float about 0.4 bigger than the last.
This means after 5 weeks, it generally picks a location or item pool immediately adjacent to the
first. The game also uses the exact same seed for both the location and item pool. The only reason
we see variation is because the two lists are different sizes. But because the sizes have a common
multiple of 2, we already lose out on half the possible variation. Then because of that 0.4
increment again, we will pick entries in roughly the same order every single 52/66 week cycle, just
with a little bit of noise mixing them up, killing most of the remaining variation. And finally,
because the increment isn't perfectly 0.4, there's a slight error, it eventually, over hundreds of
years, causes a slight shift in the results.

Now what have we learnt?
- Assumptions about randomness depend on you using it correctly.
- Don't only call your random function once.
- Don't feed incrementing seeds into a LCG.
- And for crying out loud, *don't use the same seed for two independent variables*.
