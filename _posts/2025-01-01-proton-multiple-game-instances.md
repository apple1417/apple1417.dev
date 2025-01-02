---
title: Launching multiple game instances under proton.
---

Occasionally I need to launch the same game twice under proton. It's a rare enough occurrence that I
keep forgetting how, so figured it's time to document.

1. Look up the game's steam app id, and the location of it's executable.

2. Work out which Steam Linux Runtime you're using for the game, and where it's installed. There's
   probably a better way of doing this.

   1. Temporarily add the launch args `PROTON_LOG=1 STEAM_COMPAT_LAUNCHER_SERVICE=proton` for one
      launch. You can remove them after.

   2. Open the newly created `~/steam-$appid.log`. Near the top you should see a block like:

      ```
      ======================
      
      Starting program with command-launcher service.
      
      To run commands in the per-app container, use a command like:
      
      /mnt/g/SteamLibrary/steamapps/common/SteamLinuxRuntime_sniper/pressure-vessel/bin/steam-runtime-launch-client \
          --bus-name=:1.113 \
          --directory='' \
          -- \
          bash
      ```

3. \[Optional??\] Create a `steam_appid.txt` in the same folder as the game's executable, with the
   app id as the only contents. I'm not sure if this is always required, but I've always had it for all games I've tried.
   
   Typically, if you launch a game executable directly, it will call into
   [`SteamAPI_RestartAppIfNecessary`](https://partner.steamgames.com/doc/sdk/api#SteamAPI_RestartAppIfNecessary).
   This will restart the game through Steam, and quit the executable you launched. But then Steam
   will usually see the game's already running, and just do nothing. While the `steam_appid.txt` is
   intended for development, helpfully for us it prevents the restart through steam, so usually
   unlocks running multiple instances again.

4. Launch your first copy of the game normally. Once it's running, run the command:

   ```sh
   $steam_runtime_launch_client --bus-name=com.steampowered.App$appid --directory='' -- wine $executable &>/dev/null &
   ```
   Where `$executable` is relative to the game's root directory.
