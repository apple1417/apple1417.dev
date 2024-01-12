---
description: Improved rules for the BL3 Hunt.
---
<style>
details {
  font-size: 0.9em;
}
details > summary {
  cursor: pointer;
  border: 1px solid;
  border-radius: 5px;
  padding: 0.2em 0.5em;
}
</style>

# Improved BL3 Hunt Rules v3.1

The Hunt is a competition where players race to collect all unique items in a Borderlands game
starting from a new character.

[Tracker Mod (WIP)](https://github.com/apple1417/oak-sdk-mods/tree/hunt-tracker/hunt)

[Google Sheet](https://docs.google.com/spreadsheets/d/1wwxGn2XY14qtANYcWDdREvZQzHU5c7_EGNXUQTjgW_o/edit?usp=sharing)
(note: not fully functional in Excel)

---

## Basic Rules

The hunt will run for exactly two weeks, aligned with the weekly vault card challenge reset.

<details markdown="1">
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

<details markdown="1">
  <summary>Justification</summary>
  This makes it possible to verify that you followed all rules.

  You may of course ignore this when playing along casually.
</details>

Players are ranked by progression first and character time second.

<details markdown="1">
  <summary>Justification</summary>
  If two players have the same progression, the one with less character time is ranked higher. If
  one player has 20h more character time, but managed to get one extra item, they're still ranked
  higher.
  
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

<details markdown="1">
  <summary>Justification</summary>
  Using character time simply means there's no need for restrictions. There's just no benefit to
  playing longer - in fact you could argue it explicitly hurts, fatigue leads to mistakes which cost
  time. 
</details>

You may not dashboard/read-only farm.

<details markdown="1">
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

<details markdown="1">
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

You must play on the latest version of the game, with the latest hotfixes. The only mod you're
allowed to use is the Hunt Tracker, linked at the top of the page (and the SDK supporting it).

<details markdown="1">
  <summary>Justification</summary>
  These should mostly go without saying. We want everyone to be playing though the same game, mods
  and older game versions.
  
  While some mods may have no effect, we cannot be expected to exhaustively validate this, so it's
  better to enforce a blanket ban. The Hunt Tracker was explicitly designed for this competition,
  and as a single mod can be easily validated, so it is allowed.
</details>

You may not save/profile edit your characters during the competition. Exceptions may be made if you
hardlock, and stream the entire process of recovering your save.

<details markdown="1">
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
<details markdown="1">
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
<details markdown="1">
  <summary>Justification</summary>
  As above, the point is to get everything starting from a new save, so you have to get everything
  new on those saves.
  
  It is difficult to make the distinction between items added to the Lost Loot on your current
  character vs an older one, hence the blanket ban.
</details>

You must play on Normal difficulty.
<details markdown="1">
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

<details markdown="1">
  <summary>Justification</summary>
  I kind of gave it already, each of these give big advantages to people who've played before. We
  want an average person to be able to compete, so we don't want them to immediately be outclassed
  by some hardcore fan who's saved up hundreds of diamond keys to immediately put together a full
  build upon making it to Sancturary the first time.
</details>

You may complete vault card daily/weekly challenges, and collect their xp and eridium rewards.

<details markdown="1">
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
<details markdown="1">
  <summary>Justification</summary>
  Which missions are accessible depend on who your friends have recently killed, allowing outside
  influence into your run. While the extra XP is not great, it's a conscious choice to pick these
  quests up, so it's an easy thing to ban.
</details>

The Moxxtail, Pinata, and Badass viewer ECHOcast events must be disabled. You may leave the rare
chest event and extraction event on.
<details markdown="1">
  <summary>Justification</summary>
  The first three events all introduce outside influence into your game, which may provide an unfair
  advantage to those on Twitch over other platforms, and those with more viewers over those with
  fewer.
  
  I'm not sure this rule really needs to exist given it's being shut down, but there's also not much
  reason to remove it, in case it even gets revived.
</details>

You may not buy any items from Maurice's Black Market.
<details markdown="1">
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
<details markdown="1">
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
<details markdown="1">
  <summary>Justification</summary>
  It's easy enough to get a build that instantly kills most on level enemies anyway, and most
  enemies you need to farm scale to your level, so it's not worth adding complexity to restrict
  this.
</details>
 
You may play in coop, as long as all players follow all the other rules. There must be no more than
3 levels between the highest and lowest level players in your party, to prevent powerleveling. This
restriction still applies in Cooperation mode, an endgame build will naturally clear areas easier
than a new player.
<details markdown="1">
  <summary>Justification</summary>
  Kind of said it all already, we want to allow coop, but we want to prevent power leveling. Some
  level variation between players is natural, so we arbitrarily limit it to a max of 3. This value
  has not been play tested, a different number may be more suitable.
</details>
