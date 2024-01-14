---
title: Improved BL3 Hunt Rules.
description: >-
  Improved rules for the BL3 Hunt, which have actually been playtested, and which have full
  justifications for each point.
---
<style>
details {
  font-size: 0.85em;
}
</style>

# Improved BL3 Hunt Rules v3.2

The Hunt is a competition where players race to collect all unique items in a Borderlands game
starting from a new character.

[Tracker Mod (WIP)](https://github.com/apple1417/oak-sdk-mods/tree/hunt-tracker/hunt)

[Google Sheet](https://docs.google.com/spreadsheets/d/1wwxGn2XY14qtANYcWDdREvZQzHU5c7_EGNXUQTjgW_o/edit?usp=sharing)
(note: not fully functional in Excel)

<button type="button"
        onclick="document.querySelectorAll('details').forEach(d => d.hidden = !d.hidden)">
  Toggle Justification Blocks
</button> 

---

## Basic Rules

The hunt will run for exactly two weeks, aligned with the weekly vault card challenge reset.
<details markdown="1" hidden>
  <summary>Justification</summary>
  An average completion takes approximately 60h. Taking an average 8h/day of sleep and 8h/weekday of
  work, there's only 72h of free time in a week - creating a quite tight margin. To allow an average
  person to comfortably complete the hunt within the allowed time range, we up the duration to two
  weeks. This comes to an average of ~4.5h/day required playtime.

  As will be explained later, vault cards are allowed. Completing vault cards during the competition
  provides a (slight) advantage. Aligning the start time with the weekly reset prevents people from
  accidentally completing their challenges early, or from specifically farming up all but one ahead
  of time to complete it more easily during the run. It also provides a simple extra way to signal
  the start of the competition - "You may start once your weekly challenge looks like X".

  You may of course ignore this when playing along casually.
</details>

Your entire run must be streamed live.
<details markdown="1" hidden>
  <summary>Justification</summary>
  This makes it possible to verify that you followed all rules.

  You may of course ignore this when playing along casually.
</details>

Players are ranked by progression first and character time second. If two players have the same
progression, the one with less character time is ranked higher. If one player has 20h more character
time, but managed to get a single extra item, they're still ranked higher.
<details markdown="1" hidden>
  <summary>Justification</summary>
  The reason for progression first should be obvious - the whole point of the competition is to try
  get as many items as possible. The amount of time it takes is the next thing to rank by, the
  person with the best route (or best luck) should win. Progression ties are expected, we
  deliberately design to allow an average person to collect everything, we need a tiebreaker.
  
  There are three possible ways we could track time:
  - Real time
  - Stream time
  - Character time
  
  Real time is absolutely insane, no contest should ever use it. It means the only way to win is to
  happen to live in a timezone where the competition starts right as you wake up, and have no other
  commitments so that you can no-life it from the very beginning until you finish, with as little
  sleep and as few breaks as possible. Trying to add playtime restrictions does not, and can never
  prevent this. Say you can only play for 16 out of every 24 hours, and you expect to take 60 hours
  total - during the first three days you can put in 48 hours whenever you want, but you *have to*
  do your last 12h exactly 72h after the start of the competition. None of this is remotely
  acceptable, we want to allow an average person to be able to compete, and forcing people to start
  at an exact time, avoiding food and sleep, is completely antithetical to this.
  
  So the real argument is between stream time vs character time. This has been decided based on play
  testing. When trying to optimize, character time is simply more comfortable, since you're able to
  pause at any point without losing time, whether it be to interact with chat, look up notes, make
  and submit clips, or simply to take breaks to eat or go to the bathroom. Stream time is far more
  stressful simply since you have to be efficient the entire time you're live, any break is time
  lost compared to others.
</details>

There are no playtime restrictions, play however much is comfortable.
<details markdown="1" hidden>
  <summary>Justification</summary>
  Using character time simply means there's no need for restrictions. There's just no benefit to
  playing longer - in fact you could argue it explicitly hurts, fatigue leads to mistakes which cost
  time. 
</details>

You may not dashboard/read-only farm.
<details markdown="1" hidden>
  <summary>Justification</summary>
  Doing this also resets your character time, hiding any time you spent on failed attempts.
</details>

Arms Race frequently pauses your character timer. To unpause it, and fairly track your progress, you
must take the following steps:
- Whenever you die mid run, you must save-quit, you *may not* do two runs per session.
- Whenever you fast travel into the map, you must immediately start a run and die (and sq), without
  killing anyone.

PC players can (and are recommended to) track their character time while in game using LiveSplit,
which will reveal when the timer is incorrectly paused. As it's inevitable that people will make
mistakes, top times may have their Arms Race segments retimed.
<details markdown="1" hidden>
  <summary>Justification</summary>
  This is the unfortunate downside of using character time - Gearbox is bad and broke the timer
  half the time. Arms Race takes a significant portion of the run, and includes the rarest items in
  the entire competition, so simply allowing players to keep their timer paused the entire time and
  claim it all for free is unacceptable. Play testing has shown the above rules generally (though
  not flawlessly) manage to unpause the timer, and they're simple enough that requiring them is more
  reasonable than the alternatives. Other possible solutions were switching to stream time just for
  Arms Race (awkward needing to track character time before/after and doing maths), or just
  switching to stream time in general (more stressful as discussed above).
</details>

You must play on the latest version of the game, with the latest hotfixes. The only mods you're
allowed to use are the Hunt Tracker linked at the top of the page (and the SDK supporting it), and
DXVK or VKD3D.
<details markdown="1" hidden>
  <summary>Justification</summary>
  These should mostly go without saying. We want everyone to be playing though the same game, mods
  and older game versions may completely change things. While some mods may have no effect, we
  cannot be expected to exhaustively validate this, so it's better to enforce a blanket ban.
  
  The Hunt Tracker was explicitly designed for this competition, so is of course allowed.
  
  DXVK and VKD3D may help with performance issues, and are widly used and known to not interfere, so
  are also allowed. Anyone playing on Linux under Proton will already implicitly be using one of
  these, we might as well explicitly allow it for Windows users as well.
</details>

You may not save/profile edit your characters during the competition. Exceptions may be made if you
hardlock, and stream the entire process of recovering your save.
<details markdown="1" hidden>
  <summary>Justification</summary>
  Again, this should go without saying, save editing skips through content, you have to you collect
  everything you use legitimately.
  
  That being said, this is a Borderlands game, there are many ways to hardlock. In fact, Vermilingua
  has a very unique hardlock where you can actually finish the quest and move on to the next one,
  but he never respawns (if you SQ before talking to Ma at the end), so you might not even realise 
  ou've hardlocked until hours later. It'd be remiss to say that one simple mistake like this should
  ruin your entire run, and it's not always easy to find another player to join to fix your game, so
  given sufficient explanation we can leave some leniency here.
  
  Abusing this by deliberately hardlocking just so that you can save edit ahead is not allowed.
</details>

All characters you use must be created at level 1 during the competition. You may create multiple
characters, both progression and playtime are combined between them all.
<details markdown="1" hidden>
  <summary>Justification</summary>
  The point of the competition is to gather everything starting from a new save - so obviously we
  don't want to allow starting from a level 13 save, or a save you already started on earlier.
  
  There isn't any justifiable reason to limit the amount of characters to create - so we just don't.
  
  While it could be argued that after reaching some point on your first character, you should be
  allowed to start additional characters at level 13, this would allow them to immediately jump into
  Arms Race. The Arms Race COMs are character-weighted, COMs for characters in your party are far
  more common. If we allowed level 13 saves, they instantly become the only viable way to get these
  COMs because of how much it buffs their drop rates. Weighing the time it takes to level a new
  character up to 13 against the buff it provides is an interesting point of strategy, and it keeps
  other strategies such as coop or a "traditional" single character run viable. Therefore, we
  require all characters to start from scratch.
</details>

You may only use items you collect on your new characters during the competition. You may not use:
- Any items from the Lost Loot machine.
- Any items mailed to you by friends or ECHOcast events. Items mailed by Manufacturer Challenges or
  NPCs are fair game.
- Any items in your bank from older characters. As long as you keep careful track of what you put in
  it, you may still use your bank, and if you create multiple characters, you may transfer items
  between them.
<details markdown="1" hidden>
  <summary>Justification</summary>
  As above, the point is to get everything starting from a new save, so you have to get everything
  new on those saves.
  
  It is difficult to make the distinction between items added to the Lost Loot on your current
  character vs an older one, hence the blanket ban.
</details>

You must play on Normal difficulty.
<details markdown="1" hidden>
  <summary>Justification</summary>
  I'll be honest, I don't really have one for this. We want to keep everyone playing at the same
  level, and using easy just kind of feels wrong.
  
  We still don't actually know what exactly the difficulties change, so it's possible this rule
  doesn't actually have a practical effect.
</details>

There are a number of things that provide unfair advantages to those who've played before, or worse,
to those who've save edited them to insane levels:
- Guardian Rank - You must disable it.
- Borderlands Science - You may not spend any tokens or use any boosters started before the
  competition (though you may enter the machine to finish the quest).
- Vault Cards - You may not redeem any items, or even just open the chests you get for completing
  levels (as these can give eridium).
- Golden and Diamond Keys - You may not spend either.
<details markdown="1" hidden>
  <summary>Justification</summary>
  I kind of gave it already, each of these give big advantages to people who've played before. We
  want an average person to be able to compete, so we don't want them to immediately be outclassed
  by some hardcore fan who's saved up hundreds of diamond keys to immediately put together a full
  build upon making it to Sancturary the first time.
</details>

You may complete vault card daily/weekly challenges, and collect their xp and eridium rewards.
<details markdown="1" hidden>
  <summary>Justification</summary>
  Ideally, these would be banned, as they introduce outside influence. Even with two separate
  competitions under the exact same ruleset, technically one of them would have easier challenges,
  making comparisons between the two unfair.
  
  There's one problem though: there is no way to disable them. The moment you complete the challenge
  you instantly get it's reward, and you can't deselect a vault card. The only way to prevent the
  challenges from triggering during the run is to complete them beforehand on another character -
  but this is unreasonable, especially since they may roll over in the middle of a session.
  
  In practice, everyone gets the same challenges, so as long as no one can pre-farm them (due to
  starting the competition aligned with a reset), no one has any unfair advantage. Additionally, the
  actual rewards are so minor they don't really have an impact even if they were per-player.
  
  We are able to remove vault card challenges with mods, but we want the ruleset to remain console
  compatible.
</details>

You may not pick up any of the rare spawn missions.
<details markdown="1" hidden>
  <summary>Justification</summary>
  Which missions are accessible depend on who your friends have recently killed, allowing outside
  influence into your run. While the extra XP is not great, it's a conscious choice to pick these
  quests up, so it's an easy thing to ban.
</details>

The Moxxtail, Pinata, and Badass viewer ECHOcast events must be disabled. You may leave the rare
chest event and extraction event on.
<details markdown="1" hidden>
  <summary>Justification</summary>
  The first three events all introduce outside influence into your game, which may provide an unfair
  advantage to those on Twitch over other platforms, and those with more viewers over those with
  fewer.
  
  I'm not sure this rule really needs to exist given it's being shut down, but there's also not much
  reason to remove it, in case it even gets revived.
</details>

You may not buy any items from Maurice's Black Market.
<details markdown="1" hidden>
  <summary>Justification</summary>
  As explained later, these items would not be able to be redeemed as drops, but they are still
  banned. The Black Market is simply too easy. In a run where you're constantly farming drops, money
  is no obstacle, so it's completely free legendaries you can keep coming back for, and you can
  trivially farm for certain parts or anoints. During the weeks of 2023-01-03 and 2023-12-19, the
  Free Radical was available in Skywell-27 - you could've used it for your entire run starting at as
  low as level 15. This sigificantly impacts the run between competitions, or even just for practice
  or casual run throughs.
  
  Note for the interested: I have 
  [reverse engineered the Black Market RNG]({% link _posts/2023-05-13-maurice-rng.md %}),
  and have [written a predictor for it]({% link bl3/maurice/index.html %}).
</details>

You may not duplicate items.
<details markdown="1" hidden>
  <summary>Justification</summary>
  The main thing we're trying to avoid is mass duping and selling off all the duplicates to be able
  to afford an early Crit/Hail during the first visit to Sancturary. This gives coop players a large
  advantage.
  
  If multiple players want to use the same item, it is a bit of a slog farming for multiple copies,
  especially if it's just something like a blue shield or a snowdrift. It would be nice to be able
  to dupe the first copy. However, there are already many other advantages to playing in coop, so
  requiring extra farming helps balance them out a bit.
</details>

You may farm underleveled enemies with overleved gear.
<details markdown="1" hidden>
  <summary>Justification</summary>
  It's easy enough to get a build that instantly kills most on level enemies anyway, and most
  enemies you need to farm scale to your level, so it's not worth adding complexity to restrict
  this.
</details>
 
You may play in coop, as long as all players follow all the other rules. There must be no more than
3 levels between the highest and lowest level players in your party, to prevent powerleveling. This
restriction still applies in Cooperation mode, an endgame build will naturally clear areas easier
than a new player.
<details markdown="1" hidden>
  <summary>Justification</summary>
  Kind of said it all already, we want to allow coop, but we want to prevent power leveling. Some
  level variation between players is natural, so we arbitrarily limit it to a max of 3. This value
  has not been play tested, a different number may be more suitable.
</details>

## Drops
The list of required items has been completely overhauled, and is now automatically generated from
game data. Use the sheet or the tracker mod to view it in it's entirety.

You must collect all items which have a unique Item Balance, and meet one of the following criteria:
- They have an enemy drop as their dedicated source.
  - Except for those from Vincent, who does not respawn.
- They can only be obtained from world drops.
- They are from Arms Race.

<details markdown="1" hidden>
  <summary>Justification</summary>
  This is going to be a bit of a long one.
  
### Scripts
  Firstly, you can see the scripts used to generate the list
  [here](https://github.com/apple1417/gen_uniques_db/) and
  [here](https://github.com/apple1417/oak-sdk-mods/tree/master/hunt/generate_db). Note these scripts
  contain decent amounts of "data massaging", manual hardcoded fixups for specific situations - for
  example there's a massive list of non-unique items to ignore. The scripts exist to make sure
  nothing is missed, not to completely avoid all human input.
  
### What counts as a unique item?
  The next point to discuss is what exactly counts as a separate item, we're using the *Item
  Balance*. In any situation where the game needs to roll an item, it finds the relevant *Item
  Pool*, which is a list of balances, and picks one at random. Once it has a balance, it looks
  through the data on it to determine how to roll parts. By saying we're using the balance to
  distinguish items, we're essentially just saying we don't care about what parts roll.
  
  Now while this seems simple enough, there are of course some exceptions which may make it a more
  controversial decision. The single balance:
  ```
  /Game/Gear/Weapons/Shotguns/Jakobs/_Shared/_Design/_Unique/TheWave/Balance/Balance_SG_JAK_Unique_Wave.Balance_SG_JAK_Unique_Wave
  ```
  Can, based on parts, drop with one of the following titles:
  - T.K's Wave
  - T.K's Heatwave
  - T.K's Shockwave
  - The Tidal Wave
  
  So why not count those as 4 separate items you need to get? Well if we're just going off of the,
  title, that would mean the `Shredifier` and `Super Shredifier` are two separate items, as are the
  `Sickle` and `Boom Sickle`, or the `Dark Army`, `Exceptional Dark Army`, and
  `Exceptional Dark Army +`. These are not prefixes/suffixes, these are the full title. This is the
  case anywhere in the item list where multiple item name are listed, separated by slashes. So what
  about red text? Well the King and Queen's Call have the exact same red text. Requiring you farm
  for specific parts is just extra mindless busywork - and some of them, like the Super Shredifier,
  are very rare to begin with. We might as well require getting a CMT. The only meaningful way to
  distinguish items is to use the balance, just as the game does when picking a drop.
  
  Now on the other end, there's also a case where using the balance adds extra items - the Company
  Man. Each manufacturer has it's own unique balance - and it's own set of primary stat bonuses.
  They are for all intents and purposes, completely separate items, just with a shared name, so we
  treat them as such. Additionally, play testing has shown requiring them makes Hemo more
  interesting. If you only needed a single variant, it's possible to finish Hemo in just two kills,
  whereas it takes an average of 25.46 Company Man drops to collect each variant (the Coupon
  collector's problem). This leads to decisions such as weighing the more drops per kill at high
  mayhem levels, against the quicker kill speed at lower levels, or the need to spend eridium vs
  being able to bleed out with Vermi still alive. In an optimized run, Hemo will tend to be last (so
  you can collect eridium throughout the rest of the competition), so this also means Hemo becomes a
  boss rush at the very end of the run, which just feels appropriate.
  
  The final point to discuss is the unique Artifacts/COMs which world drop. Originally, it was only
  possible to get these items via world drop, but Gearbox later patched in dedicated sources. The
  world drops use a single combined balance, which we'd normally all count as a single item, but the
  new dedicated drops each use dedicated balances, which we'd count separately. Since it's
  impossible to distinguish them in game (you could get a world drop from the dedicated source), we
  count them as separate items, as if they were all the dedicated balance, and let you redeem the
  generic balance as if it were the dedicated one it rolled as.

### Which items should be required?
  So with the list of distinct items decided on, the next thing is to decide which of them to
  actually count. Obviously, we remove items with no valid sources, including those we previously
  banned like the diamond chest or vault cards. We then remove mission items: requiring them
  essentially adds 100%ing on top of the reset of the run, making the competition even longer;
  they're no challenge to get, they're just given to you freely; and there are some missions where
  you have a choice, and you'd need a second playthough to get all.
  
  Coming at this from the other end, we obviously want to include all items which can drop from an
  enemy, the whole point of the competition is to farm them to get their drops. Vincent is the only
  case where a non-respawnable enemy has a unique drop, and even though he's guaranteed to drop the
  Initative, we exclude him since missing your one shot requires a whole second playthough. We then
  add all items which are only obtainable from world drops, since that's still a drop you can farm
  for. Finally, we add the Arms Race drops, mostly on a technicality - Harker does not have any of
  them as a dedicated drop, he simply world drops at a higher rate, but they each have a dedicated
  source in their chest room, so they don't count as items only obtainable from world drops.

  Now this leaves us with a small handful of leftovers, which we can sort into a few categories.

  **Pay to win:**
  - Cheddar Shredder
  - Deluxe Badass Combustor
  - Diamond Butt Bomb
  - Girth Blaster Elite
  - Hyper-Hydrator
  - Ultraball
  
  Like the category name suggests, you pay, and then you immediately get these items for no effort,
  so there's no sense in requiring them.
  
  **Completionism:**
  - Bekah
  - Ember's Purge
  - Miss Moxxi's Vibra-Pulse
  - Scoville
  
  **In world interactions:**
  - Burning Summit
  - Crit
  - Hail
  - Kaleidoscope
  
  Play testing has simply shown both of these categories aren't fun. Some of them are completely
  free to get along the way, others are super tedious. None of these items are a traditional "kill
  enemy and get drop", only the Kaleidoscope even drops in-world, so it's simply not worth adding
  complexity to the rules for items which are just boring. Additionally, if you're unlucky you might
  not even get the Vibra-Pulse on a character, there's no guarantee, which'd require a whole second
  run to end game, so we'd have to remove it anyway. 
</details>

The point value of each item has also been completely overhauled. Each item's value roughly
corresponds to the effort required to get it.
<details markdown="1" hidden>
  <summary>Justification</summary>
  Quite simply put, if an item's harder to get, it should be worth more, rather than simply being
  worth more due to falling in some arbitrary category. The Hot Drop is a blue launcher with a 3%
  drop rate, while the Ion Cannon is a guaranteed legendary launcher - the Hot Drop should be worth
  far more.
  
  The new point values have been put together through much play testing. The exact values are
  subjective, and they are *not* just a perfect proxy of drop rate. The rough process for coming to
  these values was follows:
  1. Start with 5 points.
  2. If an item drops more commonly, roughly divide it by how much more common it is - e.g.
     Blue/Pink Power Troopers are 2 enemies, so their items are only worth 3 points, while
     Black/Yellow/Red are 3, so their items are only worth 2. Note some enemies (e.g. the Crawlies)
     already have lower drop rates, so don't have their points affected.
  3. If an enemy takes a while to get to (Trials, Takedowns), add a point or two to their drops.
  4. Subjectively add and remove extra points for particularly rare or common items.
  5. The final value of each item is the lowest of each of it's sources - just because you can get a
     Sand Hawk from Scourge doesn't mean you're not an idiot for not just getting it from Katagawa.
  
  It's worth noting mayhem restrictions have absolutely no impact on the point value. Any decent
  endgame build will have no trouble handling mayhem levels, how lucky you get has a far larger
  impact on the total time spent, so there's no point handing out extra points for it.
</details>

To have proof of a drop, you must look at the item card and clip it. You may also grab the item and
show it off in your inventory. You may use photo mode to grab items which are normally out of reach.

When using the tracker mod, a clip of it's notification is sufficient. Note it triggers at the start
of the item card appear animation, so it may appear to trigger without viewing the card when quickly
flicking over items. However, in order for it to have triggered, you must still have gotten close
enough for the card to start appearing.
<details markdown="1" hidden>
  <summary>Justification</summary>
  Too many items look alike in order to be able to trust just seeing them on screen. With enough
  practice, you can learn how to distinguish them, however we cannot expect an average player to be
  able to do so. Viewing the item card ensures everyone is always aware of exactly what the item is.
</details>

When you get an item to drop from one of it's listed dedicated sources, you may redeem that item.
Getting an item to world drop off one of it's dedicated sources (if you can tell the difference)
counts the same as getting it through the dedicated drop. Items found in Arms Race do not need to be
extracted to count, as long as they follow all other rules.
<details markdown="1" hidden>
  <summary>Justification</summary>
  This is mostly common sense - you have to get the item from it's listed dedicated sources.
  
  In a lot of scenarios, you cannot tell the difference between getting a dedicated drop, or getting
  a world drop from the dedicated source - so we simply allow both. The most common way to tell is
  when you get two dedicated drops at the same time, allowing both is a nice bonus for getting lucky
  in this case.
  
  Extracting Arms Race drops is extra unnecessary busywork - the hard part is getting the item, not
  running to an extractor afterwards, so we simply don't require it.
</details>

You start the run with one World Drop Token. Finishing the final campaign quests unlocks a certain
amount of extra tokens. You may complete these quests multiple times by (re)starting TVHM or
creating new characters, they're worth more on subsequent completions than on the first.

Quest                                    | First | Subsequent
:----------------------------------------|------:|-----------:
Divine Retribution                       |   2   |     20
All Bets Off                             |   1   |      7
The Call of Gythian                      |   1   |      7
Riding to Ruin                           |   1   |      5
Locus of Rage                            |   1   |      5
Mysteriouslier: Horror at Scryer's Crypt |   1   |      3

At any point, you may spend a World Drop Token to redeem an item from a world drop (or any source
not listed as a dedicated source for it). This cannot be done retroactively, you must have the
token available before finding the drop, and once a token's been spent you can't change your mind it
and redeem it from a dedicated drop instead. 

<details markdown="1" hidden>
  <summary>Justification</summary>
  While there are too many world drops to allow redeeming every single one, allowing a few in leads
  to more interesting routes. Never allowing any world drops means there's a single, static, best
  route. If you can redeem some, it suddenly becomes a lot more dynamic, there's some on the fly
  routing, if you get the right combination of world drops you can skip entire areas.
  
  This is the third iteration of the "some world drops are allowed" rule, and it's turned out to
  work quite well in play testing. Awarding more tokens for completing campaigns incentives
  completing them - and more points for subsequent campaigns is an extra incentive to try help
  balance out creating extra characters. You start out with a single token, since it's disappointing
  to find a useful world drop in your initial playthrough, before completing anything, and not be
  able to redeem it.
  
  We don't allow retroactive redeems, and we don't allow changing redeems, as this removes all risk.
  The optimal strategy becomes recording every single world drop you ever get, and at the end of
  the run swapping your last N items to be from those world drops. By restricting it, every time you
  redeem a world drop there's a slight risk, "will I get the other items from this enemy before
  getting it as a duplicate", you actually have to strategise.
  
  One nice side effect of this system is we also don't need to carve out extra rules for cases like
  the Slaughter Star bosses, which keeps the rules simpler. You can either risk losing your drops to
  the void, or you can spend a few of your tokens to completely bypass it. We can expect every run
  to obtain at least 8, from one full playthrough, which is more than enough to cover this while
  still leaving plenty of room for other interesting routing.
</details>

Items from the Eridian Fabricator, mail, slot machines, vendors (including Earl's), the dedicated
loot rooms, event rewards, and mission rewards all simply count as world drops, you need to use
World Drop Tokens to redeem them. Items found in vendors do not need to be purchased to count.
<details markdown="1" hidden>
  <summary>Justification</summary>
  This grealy simplifies the rules: it's either explicitly a drop from one of the dedicated sources,
  or you use a token. No exceptions.
  
  We don't require purchasing items in vendors since money isn't really an obstacle, requiring it
  adds complexity for no real benefit. It's difficult to find a useful item in a vendor to begin
  with, so this doesn't have a big impact on the run.
</details>
  
Regardess of if you intend to redeem the items, you may not do any tricks that completely skip the
work done to access a loot source. This is defined exhaustively as:
- You may not photo mode to collect the items in the Bounty of Blood Bank multiple times, or to
  collect them before the final story mission when it normally opens - you must play through the DLC
  another time get another chance.
- You may not refresh Vaulthalla by leaving and coming back, you must kill Psychoreaver once per
  farm.
- You may not SQ before reviving Eista during "We Slass! (Part 3)" to farm his drops, you must fight
  him once per farm.

Anything not listed is ok - for example, in Arms Race you *are* allowed to photo mode exit clip to
collect loot from chests without finishing their arenas.
<details markdown="1" hidden>
  <summary>Justification</summary>
  These tricks kind of break the spirit of the challenge, they provide a lot of legendaries for zero
  effort. If there were allowed, they become the single best way to gear up - and a very useful way
  to farm world drops to use your last tokens on.
  
  The given list is exhaustive, because this kind of trick is very "I know it when I see it" - and
  fuzzy inexact rules have no place in any competition.
  
  Arms race is explicitly given as an allowed example since it's something that appears similar to
  the others, like it might be something missed from the list. It however has a far smaller impact.
  You can only photo mode exit clip the chests in the Plunderdome and Seepage and Creepage, and one
  of the chests in Shipping Encouraged. In the former two areas, you're actively under attack while
  you try do the clip, it's not completely free, and the parkour out of Plunderdome early isn't the
  easiest either. None of the three rooms have one of the COMs, so doing it doesn't impact the
  actual long Arms Race farm either, so it's simply not worth adding extra complcity to the rules to
  avoid it. In fact, allowing it adds some interesting variety to Arms Race - having a few regions
  you can clear quicker adds some interesting decisions each run, you might pop into a room you
  wouldn't normally if had to do a full clear.
</details>

## Glitches
You may not abuse Complex Root AoE Boosting. You may use a root without any AoE buffs, or AoE buffs
on other guns (even ones which double dip), just not both at the same time.
<details markdown="1" hidden>
  <summary>Justification</summary>
  Does this need explanation? It's the single most powerful build in the game, based on a rather
  obvious glitch, and it causes large flashing lights which will prevent anyone photo sensitive from
  watching. It's also allegedly not possible on the PS5 or Series X versions.
</details>
  
You may not Emote Cancel the Pestilence, Multitap, and Gargoyle reloads. You may Emote Cancel in any
other situation.
<details markdown="1" hidden>
  <summary>Justification</summary>
  An obvious glitch, which if allowed would be the most powerful build in the run. It's also not
  possible, at least not to the same effectiveness, on console/controller.
  
  Other forms of emote cancelling, such as cancelling the slam animation, are mostly harmless, and
  hard to get out of muscle memory once you've started.
</details>

You may not use the infinite Re-Volter or Toboggan duration glitches.
<details markdown="1" hidden>
  <summary>Justification</summary>
  An obvious glitch, which can be added to any other build with zero effort to get a massive free
  damage boost.
</details>

You may not use the projected shield or Beskar "invulnerability" glitches.
<details markdown="1" hidden>
  <summary>Justification</summary>
  While not true invulnerability, both of these are obvious glitches, which in the right
  circumstances allow you to just sit there and grind through M10 bosses without a care. If allowed,
  they become the single best way to deal with these bosses.
</details>

You may not abuse infinite Phalanx Doctrine or MNTIS Action skill active stacking. Accidentally
getting an extra stack is ok as long as you SQ once you notice.
<details markdown="1" hidden>
  <summary>Justification</summary>
  These are both obvious infinite stacking glitches. While not useful during farming, since SQs will
  reset them, they can be abused to great effect while working through the story.
</details>

You may not Car Warp.
<details markdown="1" hidden>
  <summary>Justification</summary>
  Gearbox only patched the simple method, it's still possible in coop by spawning a car on the same
  frame as the level transition countdown ends. This makes it a lot more difficult, and requires
  other players, but it could save hours if you manage to get it on Wotan. We want solo players to
  be able to compete without missing out on any large advantage like this. It's also yet again, a
  very obvious glitch.
</details>

You may not Skill Point Dupe.
<details markdown="1" hidden>
  <summary>Justification</summary>
  Similarly to above this requires other players, and it's of course an extremely obvious glitch,
  which is difficult to pull off, and creates single best but boring build.
</details>

You may not use Dakka Bear to charge crystals in guardian takedown, or to skip Scourge's teleport
phases.
<details markdown="1" hidden>
  <summary>Justification</summary>
  These are a bit less egregious than the others, but they still saves a decent amount of time off
  of something that's a relatively obvious glitch, and is only possible on one character. We don't
  want a glitch to make a single character the obvious best.
  
  Note that in coop the crystals take longer to charge, two people charging simultaneously is
  different to Dakka Bear + 1 Player.
</details>

Anything not listed above is allowed.
<details markdown="1" hidden>
  <summary>Justification</summary>
  There is no place for inexact rules in any competition. If something new is discovered, it should
  be explicitly added to the above list, banning things based on "you know it when you see it" is
  just plain wrong.
</details>

You *are* allowed to swap reload.
<details markdown="1" hidden>
  <summary>Justification</summary>
  This is very similar to drop reloading from BL2, a small glitch sure, but it doesn't have a
  particularly large impact, and is *extremely* difficult to get out of muscle memory once you start
  doing it. We're obviously not going to invalidate someone's run if they accidentally do it - so
  what's the point in banning it?
  
  Note banning swap reloading does not prevent Cold Bore abuse - you just end up quick swapping
  after reloading normally. It's also possible to swap reload on controller by only equipping two
  weapons and using the "swap to last" button.
</details>

You *are* allowed to go out of bounds, anywhere.
<details markdown="1" hidden>
  <summary>Justification</summary>
  You simply cannot draw a line beyond "I know it when I see it" - which has no place in a
  competition rule set. There are out of bound sequences which never clip through a wall, and there
  are areas entirely in bounds where you can easily accidentally walk straight through one. Or there
  are places you're clearly meant to go which are not displayed on the map, and there are places on
  the map you cannot reach. Additionally, the total impact of OOB sequences is hillariously minor,
  they save less than 5 minutes total across the entire competition - though there being no valid
  way to define the rule means this doesn't even need to be considered.
</details>

You *are* allowed to Rocket or Grenade Jump.
<details markdown="1" hidden>
  <summary>Justification</summary>
  This kind of leads on directly from the last point, since you don't generally use these tricks
  outside of going out of bounds. If we're not banning out of bounds, there's no real reason to ban
  these.
  
  There's also problems in drawing a line this case - an enemy shooting a rocket at your feet will
  knock you back, causing an accidental rocket jump, and obviously we don't want that to invalidate
  your run.
</details>

You *are* allowed to action skill cancel.
<details markdown="1" hidden>
  <summary>Justification</summary>
  Half of this falls under "you are allowed to emote cancel". Since the scroll abuse got patched,
  this doesn't really have much of an impact - like yes Zane can keep his kill skills up
  permanently, but he could already, or we don't really care if you skip half of an animation.
</details>
 
You *are* allowed to respawn enemies by hitting certain triggers or dying/fast traveling. Known
examples include (non-exhaustive):
- Rampager
- Slaughter Bosses
- Scraptraps
- Tom and Xam
- Seer
- The Cartels Minibosses
<details markdown="1" hidden>
  <summary>Justification</summary>
  These are all obviously minor glitches, but you still need to fight the enemies again to get
  another drop, it's not free. More importantly, they all avoid extra loading screens, which is
  greatly appreciated.
</details>

You *are* allowed to stack melee elements to dupe eridium.
<details markdown="1" hidden>
  <summary>Justification</summary>
  This takes a bit of effort to set up, and needs you to actively search for eridium piles. It also
  ends up being the fastest way to gain eridium in a lot of cases, so it helps speed up the boring
  farming if you run out while rerolling or going for Hemo kills.
</details>

You *are* allowed to stack elemental resistances and an adaptive shield to get elemental immunity.
<details markdown="1" hidden>
  <summary>Justification</summary>
  This isn't really a glitch, you're just stacking bonuses, we wouldn't ban a Zane from stacking too
  much speed. It also takes quite a bit of specific gear to setup, and ends up a lot more restricted
  than the previously discussed invulnerability glitches.
</details>
