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

Checking across far larger date ranges, the pattern continues. Why will there never be a Hellwalker
in a Pandora 1 vendor? Because somehow, these two "independent" random variables are locked in a
very tight resonance.

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

Each week, we have an array of a certain size. We pick a random value, multiply it by the size, and
use that as an index. Any index is going to be equally likely to be chosen. We then remove that
entry from the list, and return it from that week. On a week by week basis, there's obviously a bit
of bias here - you can't get the same entry two weeks in a row (unless it happens to be on the edge
of a cycle). But this is just standard selection without replacement. On the macro scale, across two
or more cycles, you'd expect any entry to be equally likely to any other. This means when we combine
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

## The Problem
So it's not how we're picking entries from the list, and it's not the RNG. You've probably already
worked out the problem - it's how they combine.

While a linear congruential generator outputs a perfectly fine stream of random numbers, it needs to
keep advancing it's internal state to do so - usually done by keeping it as a private static. If you
seed the state the same, it produces the same stream of numbers - the very definition of a PRNG.

The actual function call disassembles to the following.
```cpp
float FGenericPlatformMath::SRand(void)
{
  float fVar1;

  DAT_1468b3d54 = DAT_1468b3d54 * 0xbb38435 + 0x3619636b;
  fVar1 = (float)(DAT_1468b3d54 & 0x7fffff | 0x3f800000);
  return fVar1 - (float)(int)fVar1;
}
```
Where `DAT_1468b3d54` is the static state.

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

Every week gets a random index approximately 40% further through the list than last. Remember that
5-week pattern? Generally, after 5 weeks the game will pick an entry immediately adjacent to the one
it picked last time. And because the lists are ordered, the adjacent location is typically on the
same or on an adjacent map. The exact same happens with item pools, but it's harder to notice.

Now this isn't a perfect rule. It isn't a perfect 40% increment so sometimes enough error builds up
to jump two indexes instead of one, and when the 52/66 week cycles reset there can be even larger
ones. We can even see some of these in the example grid. But in the majority of cases, the rule will
work fine.

# Macro Scale Patterns
So we've solved the short term 5-week pattern. What about the longer term ones, across thousands of
weeks, when you pin a location/item pool? Of course, they're due to the exact same thing.

If we assumed it's a perfect 40% increment, and that there was no removal of picked entries, we'd
expect to see the exact same 5 location-item pool pairs. Because it's not a perfect 40%, they do
eventually shift. Using the actual increment, after 8 weeks locations acrue an error greater than
one index. But the very next week, item pools do too - so the two are a pair again. This resonance
is exactly what we saw.

|  Week | Location Index | Item Pool Index | Error      |
|------:|---------------:|----------------:|:----------:|
|     0 |              0 |               0 |            |
|     1 |             20 |              26 |            |
|     2 |             41 |              53 |            |
|     3 |             10 |              13 |            |
|     4 |             31 |              40 |            |
|     5 |              0 |               0 |   +0, +0   |
|     6 |             21 |              27 |   +1, +1   |
| **7** |         **42** |          **53** | **+1, +0** |
|     8 |             11 |              14 |   +1, +1   |
|     9 |             32 |              41 |   +1, +1   |

Now because we know how many weeks are ever possible, we can do a quick bit of brute forcing to
find all the location-item pool pairs.

```py
>>> arr_index = lambda week, size: int(((0.4024721384 * week) % 1) * size)
>>> pairs = {(arr_index(w, 52), arr_index(w, 66)) for w in range(10000000)}
>>> len(pairs)
116
```
{: .no-lineno}

The 116th pair appears after just 2716 weeks, so I'm happy to call this exhaustive.

*Assuming no removal of picked entries*, there are only 116 possible location-item pool pairs. There
are 3432 ways to pick pairs, but only about 1 in 30 ever happen. Every location always sees exactly
1 or 2 pools, and every pool always sees exactly 2 or 3 locations.

Now what happens when we re-introduce removal. Not enough. Like we previously established, the game
will just pick the entry adjacent to the one it did 5 weeks earlier. This manifests itself as a bit
of extra noise around the expected point - typically 5 or so entries in either direction. I'm sure
there are particular indexes which roll near the end of the cycles more often, and thus have larger
standard deviation, but I haven't checked everything to find them.

As for what we were originally hoping for - `ItemPool_BMV_Week30` somewhere in Pandora 1. It's
normal location indexes are 36, 37, and 38, but we wanted 0-5 - literally the exact opposite side of
the array. The only way for it to ever work is if it rolled as the very last item pool in a 66 week
location cycle, and if one of the Pandora 1 locations had yet to roll, and unfortuantly, across
all valid dates, there's just never a time it happens.
