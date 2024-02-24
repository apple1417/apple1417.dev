---
title: Native Python modules using SQLite
description: Porting Python code which used SQLite into a native module.
---

I had some existing Python code, which performed some SQLite queries inside a hot loop. SQLite
itself was never a bottleneck, but this loop needed optimization, and since there was no algorithmic
way to improve it, I had to port it to a native module.

# Linking against sqlite3.dll
Before getting into this further: I was targeting a Windows executable, this may be slightly
different if compiling for Linux.

So first step is actually linking against SQLite. There's an article on
[How To Compile SQLite](https://www.sqlite.org/howtocompile.html) already on their site, but it only
really explains statically linking. Python already comes with a `sqlite3.dll`, linking against it
would prevent duplicate code, saving on filesize (it's 1.5mb), and would mean we can guarantee both
Python and the native module are always using the same version. So how can we do that?

If you check the SQLite downloads page, you can find precompiled Windows binaries. These zips
contain a `sqlite3.def` and a `sqlite3.dll`. You can also grab the amalgamation zip to find the
`sqlite3.h`. In theory, this should be everything needed to link with it. However, linking actually
requires an import library file. You *can* manually generate these, a number of ways:

```sh
lib /def:sqlite3.def /machine:x64 /out:sqlite3.lib
llvm-lib /def:sqlite3.def /machine:x64 /out:sqlite3.lib
llvm-dlltool -m i386:x86-64 -D sqlite3.dll -d sqlite3.def -l sqlite3.lib 
```

Linking using the lib files should then just work. However, I was using CMake to support a number of
different toolchains at once, and could not come up with a way to get it to do this for me - it'd
just be wrong to require LLVM if you're compiling the rest of the project with MinGW.

So what's my actual solution? Unfortuantly, the best I came up with was just compiling from it as a
shared library from scratch, and then completely ignoring the dll.

```cmake
include(FetchContent)

FetchContent_Declare(
    sqlite3_amalgamation
    URL      https://www.sqlite.org/2023/sqlite-amalgamation-3420000.zip
    URL_HASH MD5=eb9a6e56044bc518e6705521a1a929ed
)
FetchContent_MakeAvailable(sqlite3_amalgamation)

add_library(sqlite3 SHARED "${sqlite3_amalgamation_SOURCE_DIR}/sqlite3.c")
target_include_directories(sqlite3 PUBLIC "${sqlite3_amalgamation_SOURCE_DIR}")
if(MSVC)
    target_compile_definitions(sqlite3 PRIVATE "SQLITE_API=__declspec(dllexport)")
else()
    target_compile_definitions(sqlite3 PRIVATE "SQLITE_API=__attribute__((dllexport))")
endif()
if(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    # Sqlite uses a few intrinsics which clang doesn't implement, but it compiles fine ignoring them
    target_compile_options(sqlite3 PRIVATE -Wno-ignored-pragma-intrinsic)
endif()

set_target_properties(sqlite3 PROPERTIES
    DEBUG_POSTFIX "_d"
)

...

target_link_libraries(my_module PRIVATE sqlite3)
```

If you're running a debug build of Python, it looks for `sqlite3_d.dll`, hence setting the postfix.
You may not want this if you're running release Python but a debug native module.

## Finding the right SQLite version
When compiling I made sure to link against the exact same version of SQLite my Python install
shipped with. In practice, I expect this isn't strictly necessary, as long as you're not doing
anything too advanced with newer functions you can probably get away with downloading the latest
amalgamation.

To start, find the version python's using:
```py
import sqlite3
con = sqlite3.connect(":memory:")
cur = con.cursor()
cur.execute("select sqlite_version()")
print(cur.fetchall())
```
```
[('3.40.0',)]
```

Surprisingly, SQLite does not seem to have a good list of previous version downloads. They all still
exist on the server, but I couldn't find a table of links. The best process I came up with was to
copy one of the links for the existing version, replace the version number, and look up the year of
release in the [Release History](https://www.sqlite.org/changes.html).

# Prepared Statements and File Locking
So at the beginning I mentioned I run a bunch of queries in a loop. Originally, the Python code
opened a new database connection every iteration. While this wasn't the bottleneck, when rewriting
it, this was an obvious situation to use a prepared statement and keep the connection open.

A separate feature in this codebase was resetting the database back to it's default state. In
Python, this was easy to do by just deleting the file and copying a template back. However, by
keeping the native module's database connection open the whole time, the database file gets locked.
In order to be able to delete it, we need to close the connection. This also adds an extra
complication when using prepared statements, as they are linked to the connection, and need to be
freed on close and remade after.

So the simple solution to this is just to design your database in such a way that you can just run
`DELETE FROM Table` a few times, and never really need to mess with files. I could've done this, but
felt a little uneasy about accidentally making permanent changes, or needing to deal with migrations
between versions. I instead still strived to solve this via replacing the file.

The solution I came up with was using a wrapper function to keep a pointer to each statement, and
only using weak pointers externally.

```cpp
std::shared_ptr<sqlite3> database{};
std::vector<std::shared_ptr<sqlite3_stmt>> all_statements{};

bool ensure_prepared(std::weak_ptr<sqlite3_stmt>& statement, std::string_view query) {
    if (!statement.expired()) {
        return true;
    }

    if (database == nullptr) {
        // Re-open db
    }

    sqlite3_stmt* raw_statement = nullptr;
    auto res = sqlite3_prepare_v3(database.get(), query.data(), static_cast<int>(query.size() + 1),
                                  SQLITE_PREPARE_PERSISTENT, &raw_statement, nullptr);
    if (res != SQLITE_OK) {
        return false;
    }

    all_statements.emplace_back(raw_statement, sqlite3_finalize);
    statement = all_statements.back();
    return true;
}
```

```cpp
static const constinit std::string_view query = "SELECT * FROM Table";
static std::weak_ptr<sqlite3_stmt> static_statement;
if (!ensure_prepared(static_statement, query)) {
    throw std::runtime_error("Failed to prepare query!");
}
const std::shared_ptr<sqlite3_stmt> statement{static_statement};

sqlite3_reset(statement.get());
// ...
```

If the weak pointer is empty, we'll create a new statement, and store it in a shared pointer
locally. If we destroy the shared pointer, the weak pointer will be empty again, so on next use
we'll create a new one.

By giving the shared pointers custom destructors, we can close everything by simply doing:

```cpp
void close_db(void) {
    all_statements.clear();
    database = nullptr;
}
```
I exposed this function to Python, and called it right before deleting the database file. Each
prepared statement gets automatically recreated on next use.

# Simultaneous Connections and File Locking
During testing of the rewrite, several times I ran into a case where there was a sudden hang for
several seconds around operations which I knew accessed the database. By stopping execution and
looking through the stack trace, I found it was in SQLite's code, blocking on trying to access the
file. I also noticed this happened both in queries run by Python, as well as those run by the native
module. Even through they're running in the same process, using the same SQLite dll, the two
connections are clearly blocking each other.

I actually ran into both the reason for this and it's solution quite quickly. In the default
rollback journal mode, SQLite does not allow readers and writers to access the database at the same
time - and one connection was writing to the database at the same time another was reading. I'm not
entirely convinced that they were truly simultaneous, but it was certainly close enough that
Windows might've still had the file locked. It must've run into some aggressive retry backoff to
cause a noticeable hang. 

So what's the solution? Simply enable [Write-Ahead Logging](https://www.sqlite.org/wal.html). This
allows for multiple readers to run at the same time as a writer. Multiple writers are still a
problem, but this is never something relevant in my situation (there are only two connections, and
the native module in fact opens the database in read only mode). Enabling it immediately fixed all
the hangs.

## WAL Checkpointing
When using WAL, writes are written to a separate journal at first, and eventually get combined back
into the main database. Another problem with my setup was
[Checkpoint starvation](https://www.sqlite.org/wal.html#avoiding_excessively_large_wal_files).
Checkpoints cannot run while a reader is open, and I always have a connection open in the native
module so that I can use its prepared statements, meaning the journal grew endlessly.

I tried using destructors or atexit handlers to force a checkpoint, but didn't have much luck.
Instead, I found it simplest to just call `close_db` from Python just before running a separate,
semi-frequent query. This wasn't run often enough to impact my hot loop, but it was still frequent
enough to prevent the journal growing too badly. Once Python finished and closed it's connection,
all connections were closed, so SQLite would automatically run a checkpoint.
