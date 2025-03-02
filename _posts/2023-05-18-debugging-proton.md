---
title: Debugging under Proton
description: How I got a Linux host to compile and debug a dll mod being run under Proton.
---

**Update 2024-09-20:**
Since Proton 9, Valve have added some more official support/documentation on debugging.

[https://github.com/ValveSoftware/Proton/blob/proton_9.0/docs/DEBUGGING.md](https://github.com/ValveSoftware/Proton/blob/proton_9.0/docs/DEBUGGING.md)

---

For the past few months I've been working on [unrealsdk](https://github.com/bl-sdk/unrealsdk), a C++
library to interact with Unreal Engine objects, primarily targeting the Borderlands series. One of
my goals the whole time has been to make sure you can compile it from Linux. I was originally doing
so under WSL, but it's compile times were 120x worse than just using a native install. The latest
versions of the Borderlands games are all Windows-only (there are some native builds, but only for
older outdated versions), so once I ran into a Linux-build-only bug, I had to work out how to
develop and debug under Proton.

This post will be half a guide and half an exploration of my process- in case you're following along
but need to try something different.

# Compiling for Windows from Linux
Compiling is the simple part. The classic way to compile for Windows from a Linux host is to use
MinGW-w64. I built unrealsdk using CMake from the beginning, from experience I knew MSBuild isn't
great at handling large numbers of targets, it's very easy for the compiler options to get out of
sync. CMake has the advantage of already being cross platform - I just had to write a small
toolchain file to point it at MinGW. If you're still using MSBuild, you will need to port your build
system to something else.

```cmake
set(CMAKE_SYSTEM_NAME Windows)

set(MINGW_TOOLCHAIN_PREFIX x86_64-w64-mingw32)

set(CMAKE_C_COMPILER ${MINGW_TOOLCHAIN_PREFIX}-gcc)
set(CMAKE_CXX_COMPILER ${MINGW_TOOLCHAIN_PREFIX}-g++)
set(CMAKE_RC_COMPILER ${MINGW_TOOLCHAIN_PREFIX}-windres)
```

So I pointed CMake at this toolchain, started a build... and got treated to a massive wall of
errors. I've got to point out my favourite.
```
/mnt/p/unrealsdk/src/unrealsdk/logging.cpp:14:6: error: ‘mutex’ in namespace ‘std’ does not name a type
   14 | std::mutex mutex{};
      |      ^~~~~
/mnt/p/unrealsdk/src/unrealsdk/logging.cpp:8:1: note: ‘std::mutex’ is defined in header ‘<mutex>’; did you forget to ‘#include <mutex>’?
    7 | #include <mutex>
  +++ |+#include <mutex>
    8 |
```

To cut a long story short: unrealsdk depends on some "newer" C++ features, which weren't yet
supported. As far as I understand it, MinGW is downstream of GCC, so it takes a bit to incorporate
newer features, and then it takes your distro's package maintainers a bit to include new MinGW
releases, so it generally always ends up a bit behind.

Luckily, I found [llvm-mingw](https://github.com/mstorsjo/llvm-mingw), which is a drop in
replacement. Like the name suggests, it uses the LLVM toolchain, including the latest version of
libc++, which supported everything I needed.

Since I'm not sure where else to put this, I'm just going to mention here that I found that
[ninja](https://ninja-build.org/) compiled up to 10x faster than makefiles, which CMake generates by
default. My whole motivation for switching to Linux was to avoid WSL's build times, this is a
significant boost (under WSL I only saw a 2x improvement, it's constrained by disk access).

# Debugging Proton
So we can compile from Linux. How do you debug? Compiling's useless without being able to do that.

To start with, use a known good build, or just don't use your mod at all, and get the game running
stably under Proton. You don't want to be messing with it's options at the same time as you're
trying to debug it. Once it runs, launch it once using `PROTON_DUMP_DEBUG_COMMANDS=1 %command%`.
This will create a bunch of files in `/tmp/proton_$USER/`, which dump the entire Proton
configuration. Of these, `gdb_run` is closest to what we want, copy it somewhere else, then you can
clean up your launch args and delete the other files. Running this script should launch the game and
put you into a gdb session.

If you're not using Steam, this step is equivalent to just putting together a shell script which
launches your executable with the correct wine prefix and all required env vars. To get into the
debugger, run:
```sh
wine winedbg --gdb executable.exe args
```

Of course make sure you're compiling with appropriate debug information. For MinGW, it's just adding
`-ggdb3`.

So this works, but I've never found using pure gdb to be the best debugging experience. It's of
course good to learn how to use it properly, for when your frontend can't handle everything, but a
good frontend makes standard usage 100x easier. Add `--no-start --port 2159` to run it as a server,
and then you can attach to it from your frontend of choice. `--no-start` is important in case you
ever need to debug initialization. If you want the game to auto run, let your frontend be what calls
continue, since it (hopefully) will only do so after setting all your breakpoints.

## VSCode
So my frontend of choice is VSCode - using Microsoft's propritary C/C++ extension. This is only
available from the Microsoft marketplace, if you're running VSCodium or Code OSS you'll have to play
around with some settings or just choose something else.

To start, add the following task, to launch the wine session.
```jsonc
{
    "label": "launch proton gdb server",
    "type": "shell",
    "command": "<path to launch script>",
    "hide": true,
    "isBackground": true,
    // Need a dummy problem matcher to prevent the launch configuration waiting for complete
    "problemMatcher": [
        {
            "pattern": [
                {
                    "regexp": ".",
                    "file": 1,
                    "location": 2,
                    "message": 3,
                }
            ],
            "background": {
                "activeOnStart": true,
                "beginsPattern": ".",
                "endsPattern": ".",
            }
        }
    ]
}
```

Then the following launch configuration will run the task and connect to the gdb server.
```jsonc
{
    "name": "proton gbd",
    "type": "cppdbg",
    "request": "launch",
    "program": "<path_to_executable>",
    "stopAtEntry": true,
    "stopAtConnect": false,
    "MIMode": "gdb",
    "miDebuggerPath": "gdb",
    "miDebuggerServerAddress": "localhost:2159",
    "preLaunchTask": "launch proton gdb server",
}
```

Just remember that if you want to edit launch args or environment variables, you have to edit the
launch script, not the VSCode settings.

Now with these two added, hit debug... and it works. The game launches, you can set breakpoints, hit
them, step through code, it all just works.

## It doesn't all just work
The above being said, there are a number of annoyances, things which don't prevent debugging, but
don't work quite like they should.

To start with, since I was building using llvm-mingw and libc++, gdb doesn't understand any of the
standard library's types. To address this, you can download [this repo](https://github.com/koutheir/libcxx-pretty-printers/)
which has some custom pretty printers.

I could not get it to recognise my types. It knows that an object exists, it knows if it's a pointer
or value. But I can't get it show any of it's fields. It does know the standard library fields, even
without the pretty printers, just not mine. It even lets me step into class methods, it's not a
source mapping issue it should know they're there. But it just can't read any fields off of them.

The call stack is usually weirdly truncated. I've never seen it hit a breakpoint and understand more
than two stack levels. If you step into a function while paused, it usually goes up to three - but
not always, sometimes stuff falls off. If you step out of the function (or rather single step
through to the first return statement) it will work, and it will come up with some new stack levels,
it just never manages to show you them all at once.

It doesn't understand thread names. Usually not a big problem, but sometimes I liked to pause the
game and jump over into my thread to see what it was stuck working on.

And saving the weirdest for last: step instruction does not always step a single instruction. I had
a case where I was stopped on a `sub rsp, 0x48` instruction, and even if I ran `si` manually through
the gdb console, I'd immediately jump to an exception handler. I believe this comes from winedbg
just pretending it's gdb compatible, and actually executing a whole line. Breakpoints still work in
the range it jumps over, so to solve it I put a breakpoint as far up the call stack as I could see,
and repeated it a few times until I found the bug which was actually throwing.

Despite all this, it's still an acceptable debugging experience - it's no print debugging - but
it just makes it that extra bit more annoying. I'm still going to stick with primarily developing
from Windows using Visual Studio, since its debugger just works better.

## LLDB
I did try using lldb. I came across [this post by werat](https://werat.dev/blog/debugging-wine-with-lldb-and-vscode/)
detailing almost the exact thing I wanted - but I could never get it to work. I can't remember which
way around exactly it was, but attaching to one process would constantly break on exceptions and
different signals (which I assume are just wine/windows api internals) making it unusable, and the
other wouldn't load symbols and just generally couldn't interact with the game process (which I
assume's the mentioned lack of a dynamic loader). Even just trying to attach to the gdb server
didn't work properly. If you can get lldb to work, I feel like it will have a far better debugging
experience, especially if you're using as much of the LLVM toolchain as I already am. You could even
use it from a Window host for a consistent cross platform experience.

# Not a true Windows build
Now while we're able to compile and debug a Windows build, and it runs perfectly fine, it turns out
it's not a true Windows build. It does not create code completely compatible with code we'd see
compiling natively. The fact that I was using llvm-mingw makes this a lot more obvious.

Windows:
```
> clang --version
clang version 16.0.3
Target: x86_64-pc-windows-msvc
Thread model: posix
InstalledDir: [...]
```
Linux:
```
> x86_64-w64-mingw32-gcc --version
clang version 16.0.3 (https://github.com/llvm/llvm-project.git da3cd333bea572fb10470f610a27f22bcb84b08c)
Target: x86_64-w64-windows-gnu
Thread model: posix
InstalledDir: [...]
```

On Windows, Clang compiles under the `msvc` environment, but under Linux it compiles under `gnu`.
I'm pretty sure this is it accurately emulating how MinGW works, it's not an issue with Clang
itself. But what exactly does this mean for us? To answer this I need to explain a bit more about
the unrealsdk project structure.

For reasons I won't get into, you can only run one copy of the sdk per game process. But what if you
want to use two separate projects both linking against it? To solve this, instead of linking
statically, I provide an option to build the sdk as a shared library, and link against that, so
there's ever only one copy, but multiple projects can all use it at once. Because we're already
using multiple different compilers and standard libraries, all the exported functions use a pure C
ABI, so you can mix and match projects from different compilers. This is important in case you're
developing one project while still running other precompiled ones. But there's one thing which we
can't easily convert to a C ABI: exceptions. And guess what ABI changes between `msvc` and `gnu`? If
you try mix exception ABIs, the game just crashes when an exception passes between them.

If you're building a single static project, or if you're never going to let exceptions cross module
boundaries, sticking with `gnu` is completely fine. In my specific weird scenario however, this is a
problem.

## Why use exceptions?
Before moving on, I just want to explain a bit more about why I decided letting exceptions travel
over module boundaries was the right solution. Feel free to jump right to the next heading.

Firstly, one of the main philosophies of the project: We need to be as invisible as possible. Break
the sdk if need be, I don't care if it means we're limping along unable to do anything else, we do
not break the game. Crashing the game is completely unacceptable. This means disabling exceptions is
a complete non-starter, since that just turns any exception thrown deep down in some library call
into a crash.

Why not use `noexcept`? Because like with disabling exceptions globally, it actually means
"if an exception gets here without being caught, crash the game". Compilers might give a warning if
they work out a `noexcept` function can throw, but it's no guarantee, they'd have to solve the
halting problem. The sdk in fact makes use of a tonne of templating, which makes it very easy for
exceptions to hide from the compiler.

Why not catch the exception right before the boundary, and re-throw it after? This makes us lose a
lot of information. If you're using debug versions of both the sdk and your library, the stack
trace will go right back into the sdk, which can often tell you a lot more about the error - we'd
lose that. We'd also lose the exact exception type, or at least limit it to one of a known subset.
Since the exception gets destroyed on leaving the catch block, we'd also need to copy it's fields -
which means if we don't know the type we lose any unknown fields. And finally, checking if the other
side threw is just a lot of overhead for a case which is by definition exceptional.

Why can exceptions even happen? Because we can't stop them. One of the major features of the sdk is
hooks, you can register a callback to be run when an unrealscript function is called. But this means
the sdk is calling user code. And we definitely can't trust user code to never throw. If it does, we
need to catch it so that we remain invisible, so we can let the unrealscript code continue as if
nothing happened. None of the exported functions actually intentionally throw an exception, they all
prefer returning an appropriate failure value. But it's not worth searching through the whole call
graph to make sure they *never do*, because we know hooks will always be able to throw, so we'll
always need to deal with exceptions passing between modules anyway.

# Compiling with the MSVC Exception ABI
So, how can we compile a MSVC ABI build from Linux. Clang natively supports cross compiling, but it
needs access to the MSVC headers/libs - and unrealsdk depends on a small a handful of things from
`windows.h`, so I can't just point it at libc++. So how can we get these? I found two projects which
can help, [msvc-wine](https://github.com/mstorsjo/msvc-wine) (from the same guy as llvm-mingw), and
[xwin](https://github.com/Jake-Shadle/xwin/). The super quick comparison: msvc-wine is better to
install locally on your dev machine; xwin is better to use in CI.

Two extra things I want to quickly note: msvc-wine does also, like the name implies, contain a bunch
of scripts to let your run MSVC under wine. I didn't explore this, since I figured it'd probably
have worse performance and might not be as stable. And the second: xwin does not (yet) provide the
vc debug dlls, `vcruntime140d.dll` and the like, which you'll need to launch any debug builds. It
does provide everything required to compile a debug build though, so if you can get them from
another source it'll still work fine.

Once you've picked one of the tools and got it downloaded, you can start compiling. I put together
the following cmake toolchain. It requires you pass in the triple you want to compile for, and
either the path to the relevant msvc-wine `msvcenv.sh` script, or the path to the xwin install
folder.

```cmake
set(CMAKE_SYSTEM_NAME Windows)

set(CMAKE_C_COMPILER clang)
set(CMAKE_C_COMPILER_TARGET ${CLANG_TRIPLE})
set(CMAKE_CXX_COMPILER clang++)
set(CMAKE_CXX_COMPILER_TARGET ${CLANG_TRIPLE})
set(CMAKE_RC_COMPILER llvm-rc)

# Problem: CMake runs toolchain files multiple times, but can't read cache variables on some runs.
# Workaround: On first run (in which cache variables are always accessible), set an intermediary environment variable.
# https://stackoverflow.com/a/29997033
if(MSVC_WINE_ENV_SCRIPT OR XWIN_DIR)
    set(ENV{_MSVC_WINE_ENV_SCRIPT} "${MSVC_WINE_ENV_SCRIPT}")
    set(ENV{_XWIN_DIR} "${XWIN_DIR}")
else()
    set(MSVC_WINE_ENV_SCRIPT "$ENV{_MSVC_WINE_ENV_SCRIPT}")
    set(XWIN_DIR "$ENV{_XWIN_DIR}")
endif()

if(EXISTS ${MSVC_WINE_ENV_SCRIPT})
    # @brief Extract paths from the env script and pass them to another function
    #
    # @param env_var The environment variable to extract
    # @param prefix A prefix to add to the start of each path (e.g. `-I`)
    # @param output_function The function to call with the list of extracted paths
    function(_extract_from_env env_var prefix output_function)
        execute_process(
            COMMAND bash -c ". ${MSVC_WINE_ENV_SCRIPT} && echo \"\$${env_var}\""
            OUTPUT_VARIABLE env_output
            COMMAND_ERROR_IS_FATAL ANY
        )
        string(REPLACE "z:\\" "${prefix}/" env_output "${env_output}")
        string(REPLACE "\\" "/" env_output "${env_output}")
        string(REGEX MATCHALL "[^;\r\n]+" env_output_list "${env_output}")

        cmake_language(CALL ${output_function} ${env_output_list})
    endfunction()

    _extract_from_env("INCLUDE" "-isystem" add_compile_options)
    _extract_from_env("LIB" "-L" add_link_options)
elseif(EXISTS ${XWIN_DIR})
    add_compile_options(
        "-isystem${XWIN_DIR}/sdk/include/um"
        "-isystem${XWIN_DIR}/sdk/include/ucrt"
        "-isystem${XWIN_DIR}/sdk/include/shared"
        "-isystem${XWIN_DIR}/crt/include"
    )

    if(NOT DEFINED XWIN_ARCH)
        if(${CLANG_TRIPLE} MATCHES 64)
            set(XWIN_ARCH x86_64)
        else()
            set(XWIN_ARCH x86)
        endif()
    endif()

    add_link_options(
        "-L${XWIN_DIR}/sdk/lib/um/${XWIN_ARCH}"
        "-L${XWIN_DIR}/crt/lib/${XWIN_ARCH}"
        "-L${XWIN_DIR}/sdk/lib/ucrt/${XWIN_ARCH}"
    )
else()
    message(FATAL_ERROR "One of 'MSVC_WINE_ENV_SCRIPT' or 'XWIN_DIR' must be defined, could not find windows headers/libs!")
endif()

add_compile_options(-ffreestanding)

add_compile_options("$<$<CONFIG:DEBUG>:-gdwarf>")
add_link_options("$<$<CONFIG:DEBUG>:-gdwarf>" "$<$<CONFIG:DEBUG>:-Wl,/ignore:longsections>")
```

While it's a bit of a long script, what it does is rather simple, if you needed to port it to
another build system. All you need to do is set `--target={triple}` and `-ffreestanding`, and then
point it at the include/lib dirs. When debugging, you'll also want `-gdwarf` for symbols - and since
this can throw a warning you may want to ignore it with `-Wl,/ignore:longsections`.

So using this toolchain, and setting the relevant inputs, everything compiles properly. I built my
exception test dlls, copied them over, and it works, I can catch exceptions across module
boundaries. Remember debug builds will link against the vc debug dlls, so like I mentioned earlier
you'll need to find a copy of them, and copy them over to the game as well.

Debugging works basically the exact same as with the MinGW build, with the exact same annoyances.
There one more big problem though: If an exception is thrown while the debugger is attached, the
game crashes. Launching the game without debugger, using the exact same build, it runs fine, it's
not an exception which goes uncaught. I haven't been able to work out a way around this, I assume
it's something related to debuggers catching an exception at it's source, some behaviour winedbg
doesn't emulate properly. If your project throws a lot, this is probably a dealbreaker, you'll have
to stick with using GNU ABI builds for debugging, and then only use this method to get a MSVC ABI
build for releases (assuming of course that's the ABI you're releasing with).
