---
title: Handling Unreal Engine's changing object layouts while modding
description: An overview of how the Borderlands modding sdk has addressed various differences in the object layouts.
---

I've been cleaning up the Borderlands series' modding sdk for a while now. The central component of
this is my library [`unrealsdk`](https://github.com/bl-sdk/unrealsdk), which handles all the
interaction with Unreal Engine objects. In the modding community, there are generally considered to
be 7 distinct games in the series, released across a span of 13 years, with Borderlands 4 on the way
shortly. Luckily, the logic used by the sdk hasn't really changed, but what has changed quite a lot
is the way objects are laid out in memory. The same field might be at an offset of 0x50 in one game,
0x58 in another, and 0x20 in a third.

In this post I'll go through some of the particular problems we encounter, and how they have been
handled historically. In the next post we'll build a system that can support all layouts in the same
codebase, with the ability to swap at runtime - one dll, any game.

# Background
So before we get started, the rest of this will make a bit more sense if you understand how the
various games differ tech wise. Lets start with how they branched off each other.

![Game branch diagram]({{ "/assets/posts/unreal-object-layouts/game-branches.svg" | relative_url }})
{: style="max-width: 60%; margin: auto"}

Borderlands 1 was based off a custom version of Unreal Engine 3, which Gearbox acquired the rights
to modify. Borderlands 2 and The Pre-Sequel are further iterations of this engine, each on slightly
later versions. Then it came time for the remasters. As you'd expect, Borderlands 1 Enhanced is a
fork of BL1, and Attack on Dragon Keep Standalone, which was originally a BL2 DLC, is a fork of BL2.
Borderlands 3 ran on a brand new engine, based on Unreal 4, with Wonderlands being a further
iteration of it. And finally, while we can't say for sure before release, there's evidence to point
to Borderlands 4 being an iteration on the WL engine, perhaps merging in some Unreal 5 features.

The games are often grouped into the following categories, based on Gearbox's codenames. Mods are
often compatible between games in their category.
- **Willow**: BL1 and BL1E
- **Willow2**: BL2, TPS, and AoDK
- **Oak**: BL3 and WL

Another interesting technical spec to note is the architecture of each game.

Game | 32-bit | 64-bit
:----|:------:|:------:
BL1  |   X    |
BL2  |   X    |
TPS  |   X    |
BL1E |        |   X
AoDK |   X    |
BL3  |        |   X
WL   |        |   X

Now of course this kind of breaks that nice catchphrase from before "one dll, any game", we're
forced to have separate dlls for each architecture. We'll still endeavour to support all games of
the same architecture within the same dll though.

The case of BL1 vs BL1E here is worth pointing out. Since they've based on very similar engine
versions, they should have all the same object layouts, only differing due to pointer size.

# `UProperty`
One of the most important types the sdk uses is `UProperty`. Unreal has a very in depth object
introspection system, which is powered by these properties. Each `UProperty` describes a single
field on an object, it's type, where it's located, how big it is, and any other type specific
parameters.

Here's a (simplified) example of how one might be used, using BL2's object layouts.
```cpp
class UProperty : public UField {
   public:
    int32_t ArrayDim;
    int32_t ElementSize;
    uint32_t PropertyFlags;

   private:
    uint8_t UnknownData00[0x14];

   public:
    int32_t Offset_Internal;
    UProperty* PropertyLinkNext;

   private:
    uint8_t UnknownData01[0x18];
};

class UObjectProperty : public UProperty {
   public:
    UClass* PropertyClass;
};

UObject* set_obj_property(UObject* obj, const UObjectProperty* prop, const UObject* value) {
    if (value != nullptr && !value->is_instance(prop->PropertyClass)) {
        throw std::runtime_error("Object is not instance of " + (std::string)prop->PropertyClass->Name);
    }

    auto addr = reinterpret_cast<uintptr_t>(obj) + prop->Offset_Internal;
    *reinterpret_cast<UObject*>(addr) = value;
}
```

So with this being such a core type, it's probably unsurprising it was one of the first to run into
issues. So what's the problem? Well, in TPS, which was directly based on BL2, it looks like this:

```cpp
class UProperty : public UField {
   public:
    int32_t ArrayDim;
    int32_t ElementSize;
    uint32_t PropertyFlags;

   private:
    uint8_t UnknownData00[0x14];

   public:
    int32_t Offset_Internal;
    UProperty* PropertyLinkNext;

   private:
    uint8_t UnknownData01[0xC];
};
```
```diff
@@ -12,5 +12,5 @@ class UProperty : public UField {
     UProperty* PropertyLinkNext;

    private:
-    uint8_t UnknownData01[0x18];
+    uint8_t UnknownData01[0xC];
 };
```

If we want to read `UObjectProperty::PropertyClass`, in BL2 we need to read from offset 0x80, while
in TPS we need to read from offset 0x74. For two Willow2 games, which we'd normally consider pretty
closely related.

## Solutions
So how has the sdk historically handled this? Well for `UObjectProperty::PropertyClass`
specifically, turns out the answer is actually it didn't, the original sdk just didn't validate
object properties. Whoops. Let's switch to a different, but still very similar example.

```cpp
class UArrayProperty : public UProperty {
   public:
    UProperty* Inner;
};
```

The original sdk handled this with a simple helper function.
```cpp
UProperty* UArrayProperty::GetInner() {
    if (UnrealSDK::EngineVersion <= 8631) {
        return *((UProperty **)(((char *)this) + 0x74));
    } else {
        return *((UProperty **)(((char *)this) + 0x80));
    }
}
```

Now this isn't amazing. it uses a lot of magic numbers - at one point all instances of 8630 had to be
bumped to 8631 in fact - and they need to be copied to every property with it's own fields. It's
also a bit weird that the newer game has a lower number.

When I took over development, and started writing `unrealsdk`, I got a little fancier. We can use a
templated member pointer to have a single function do all the offset adjusting, without any magic
numbers.
```cpp
class UProperty {
   private:
    static size_t class_size(void);  // Implemented using Unreal introspection

   protected:
    template <typename PropertyType, typename FieldType>
    FieldType read_field(FieldType PropertyType::*field) const {
        ptrdiff_t offset = UProperty::class_size() - sizeof(UProperty);

        auto as_derived = reinterpret_cast<const PropertyType*>(this);
        auto field_ptr = &(as_derived->*field);

        auto adjusted_ptr = reinterpret_cast<uintptr_t>(field_ptr) + offset;
        return *reinterpret_cast<FieldType*>(adjusted_ptr);
    }
};

class UArrayProperty : public UProperty {
   private:
    UProperty* Inner;

   public:
    UProperty* get_inner(void) const {
        return this->read_field(&UArrayProperty::Inner);
    }
};
```

This solution also optimizes quite well. All three major compilers optimize it down to essentially
just a function call (which may also get inlined in practice) and a single addition, completely
getting rid of the branch from the previous implementation.

[Compiler Explorer][CE01]

[CE01]: https://godbolt.org/#g:!((g:!((g:!((h:codeEditor,i:(filename:'1',fontScale:14,fontUsePx:'0',j:1,lang:c%2B%2B,selection:(endColumn:3,endLineNumber:35,positionColumn:1,positionLineNumber:27,selectionStartColumn:3,selectionStartLineNumber:35,startColumn:1,startLineNumber:27),source:'%23include+%3Ccstdint%3E%0A%23include+%3Ccstddef%3E%0A%0Ausing+std::uint8_t%3B%0Ausing+std::uint32_t%3B%0Ausing+std::size_t%3B%0A%0Aclass+UProperty+%7B%0A+++private:%0A++++uint8_t+padding%5B32%5D%3B%0A%0A++++static+size_t+class_size()%3B%0A%0A+++protected:%0A++++template+%3Ctypename+PropertyType,+typename+FieldType%3E%0A++++FieldType+read_field(FieldType+PropertyType::*field)+const+%7B%0A++++++++ptrdiff_t+offset+%3D+UProperty::class_size(void)+-+sizeof(UProperty)%3B%0A%0A++++++++auto+as_derived+%3D+reinterpret_cast%3Cconst+PropertyType*%3E(this)%3B%0A++++++++auto+field_ptr+%3D+%26(as_derived-%3E*field)%3B%0A%0A++++++++auto+adjusted_ptr+%3D+reinterpret_cast%3Cuintptr_t%3E(field_ptr)+%2B+offset%3B%0A++++++++return+*reinterpret_cast%3CFieldType*%3E(adjusted_ptr)%3B%0A++++%7D%0A%7D%3B%0A%0Aclass+UArrayProperty+:+public+UProperty+%7B%0A+++private:%0A++++UProperty*+Inner%3B%0A%0A+++public:%0A++++UProperty*+get_inner(void)+const+%7B%0A++++++++return+this-%3Eread_field(%26UArrayProperty::Inner)%3B%0A++++%7D%0A%7D%3B%0A%0AUProperty*+getter(UArrayProperty*+arr)+%7B%0A++++return+arr-%3Eget_inner()%3B%0A%7D'),l:'5',n:'0',o:'C%2B%2B+source+%231',t:'0')),k:50,l:'4',n:'0',o:'',s:0,t:'0'),(g:!((h:compiler,i:(compiler:gsnapshot,filters:(b:'0',binary:'1',binaryObject:'1',commentOnly:'0',debugCalls:'1',demangle:'0',directives:'0',execute:'1',intel:'0',libraryCode:'0',trim:'1',verboseDemangling:'0'),flagsViewOpen:'1',fontScale:14,fontUsePx:'0',j:1,lang:c%2B%2B,libs:!(),options:'-O3',overrides:!(),selection:(endColumn:1,endLineNumber:1,positionColumn:1,positionLineNumber:1,selectionStartColumn:1,selectionStartLineNumber:1,startColumn:1,startLineNumber:1),source:1),l:'5',n:'0',o:'+x86-64+gcc+(trunk)+(Editor+%231)',t:'0')),k:50,l:'4',n:'0',o:'',s:0,t:'0')),l:'2',n:'0',o:'',t:'0')),version:4

```cpp
UProperty* getter(UArrayProperty* arr) {
    return arr->get_inner();
}
```

```nasm
getter(UArrayProperty*):
        ; Stack work for function call
        sub     rsp, 24
        mov     QWORD PTR [rsp+8], rdi
        call    UProperty::class_size()
        mov     rdi, QWORD PTR [rsp+8]
        
        ; The actual calculation
        mov     rax, QWORD PTR [rdi+rax]
        
        ; Stack work for return
        add     rsp, 24
        ret
```

But now for some of the downsides.

Firstly, this is entirely dependent on there being no padding between types. If
`sizeof(UProperty) == 36`, assuming a 64-bit program, `offsetof(UArrayProperty, Inner) == 40`, to
keep the pointer 8 byte aligned. This will cause the compiler to insert an extra constant +4 into
the addition - you can try it out by editing the size of the `padding` struct in the Compiler
Explorer example. As long as `UProperty::class_size()` returns 36, the maths still checks out. But
if one version of the game optimized it a bit, and got it down to 32 bytes, then the padding goes
away, and the +4 screws up our formula.

Now in practice, this doesn't end up being much of a problem. When reverse engineering Unreal's
types, we don't know if the end of a type is padding, or just a value that happens to be zero 99% of
the time. The classes always end up naturally aligned because we end up just considering the padding
as part of the class, usually in one of those unknown data arrays. And as long as the class size
always includes the padding too, it always works out.

Another downside is with setters. In the cases where we used this solution, we only needed getters,
so it worked well enough. Adding a setter basically requires repeating all that offset adjusting
code though. And it might get more complicated for types with non trivial copy/move assignment
operators. We'll see another approach to handle this later.

Perhaps the biggest downside to the approach however is it's very specific. It only works when the
difference in object layouts happens due to a block of unknown data at the end of a class changing
size. It would not work if we wanted to access a field on `UProperty` after the one which changed
size. And it would not work if the overall size of the class stayed the same, but some internal
layout changed.

# Borderlands 3
So BL3 caused a lot of problems. The original version of the sdk only supported Willow2, it was made
before BL3 ever released, so the only problem it ever ran into was `UProperty`. BL3 came in on a
completely new engine, and upgraded to 64-bit, so basically everything changed.

The original sdk's codebase wasn't the cleanest to begin with, so trying to hack in support for
these changes proved very difficult. Eventually, I gave in, and started a from scratch rewrite, with
the explicit design goal of being able to swap out layouts as required - this became `unrealsdk`.
This process took long enough that Wonderlands had actually released in the meantime - though it has
no layout differences to BL3.

The main way `unrealsdk` handles different games is through an `AbstractHook` class. During sdk
initialization, a selector function picks which implementation to use (based off of the exe name),
and it's constructor does any game specific initialization logic. Afterwards, the sdk can just call
virtual functions, which get forwarded to the right implementation. Except wait a minute, this was a
post about object layouts. How do virtual functions help us swap object layouts? Well the secret is
they don't, we cheat. The Willow2 games are all 32-bit UE3, the Oak games are all 64-bit UE4,
they're significantly different and they can't possibly be supported in the same dll - so surely
it's fine to just use the preprocessor right? While it worked for this scenario, it turned out not
to be a long term solution.

Unreal's actually a constantly moving target. Every minor version makes a bunch of small tweaks,
which over a large enough time span add up to some major breaking changes for us. For example,
Unreal 4.23 (afaik) made some major changes to the core `FName` struct. And despite what Epic's
marketing team would like you to believe, there's really not anything that special about the major
version. This means it's not really right to treat "UE4" as a monolith, if we supported 4.10 we
might not support 4.27, and if we supported 4.27 we might still support 5.0. So if we were to use
the preprocessor, really we should have a value for every single minor version as well, which breaks
our "one dll, any game" goal, and which will quickly get out of hand.

So I already explained the solution we used for BL3's layout differences, just using the
preprocessor. Let's still go through some of the particular problems we ran into, since these will
inform the improved design we'll come up with later.

## `UObject`
`UObject` is the base class all unreal objects inherit from. Being such a core class, it seems they
spent some time optimizing by the engine version used in Oak. In the following examples private
fields are known, but are not used by the sdk - the public interface should be identical between the
games. I believe technically the compiler is allowed to rearrange private fields, but in practice
this turned out not to be an issue across any of the major three.

In Willow2, `UObject` looks like this.
```cpp
class UObject {
   public:
    uintptr_t* vftable;

   private:
    void* HashNext;

   public:
    uint64_t ObjectFlags;

   private:
    void* HashOuterNext;
    void* StateFrame;
    UObject* _Linker;
    void* _LinkerIndex;

   public:
    int32_t InternalIndex;

   private:
    int32_t NetIndex;

   public:
    UObject* Outer;
    FName Name;
    UClass* Class;

   private:
    UObject* ObjectArchetype;
};
```

In Oak, it instead looks like this:
```cpp
class UObject {
   public:
    uintptr_t* vftable;
    uint32_t ObjectFlags;
    int32_t InternalIndex;
    UClass* Class;
    FName Name;
    UObject* Outer;
};
```

To format this another way, if we assumed 8 byte pointers, so we can make a like for like
comparison, and given the fact that `FName` is 8 bytes, the fields we care about would be at the
following offsets:

Field             | Willow2 | Oak
:-----------------|--------:|--------:
`vftable`         |  0x0 +8 |  0x0 +8
`ObjectFlags`     | 0x10 +8 |  0x8 +4
`InternalIndex`   | 0x38 +4 |  0xC +4
`Outer`           | 0x40 +8 | 0x20 +8
`Name`            | 0x48 +8 | 0x18 +8
`Class`           | 0x50 +8 | 0x10 +8
`sizeof(UObject)` |    0x58 |    0x28

This is a fantastic example, it covers pretty much every problem we might run into. The entire class
is a different size. The offsets between fields in the middle of the object are different. Some
fields are in different orders. And one of the fields is even a completely different size (it's a
bitfield in both versions, so if it counts as a different type is a bit debatable).

## `GObjects`
`GObjects` is a global array holding every active unreal object. In the sdk we use it for two main
reasons:
- Getting an arbitrary object, as part of some bootstrapping process
- Getting every object of a certain class

In Willow2, this is a simple array:
```cpp
template <class T>
struct TArray {
   public:
    T* data;
    int32_t count;
    int32_t max;
}

TArray<UObject*> GObjects;
```

In Oak, it gets a lot more complex:
```cpp
struct FUObjectItem {
    UObject* Object;
    int32_t Flags;
    int32_t ClusterRootIndex;
    std::atomic<int32_t> SerialNumber;
};

struct FChunkedFixedUObjectArray {
    FUObjectItem** Objects;
    FUObjectItem* PreAllocatedObjects;
    int32_t Max;
    int32_t Count;
    int32_t MaxChunks;
    int32_t NumChunks;
}

struct FUObjectArray {
    int32_t ObjFirstGCIndex;
    int32_t ObjLastNonGCIndex;
    int32_t MaxObjectsNotConsideredByGC;
    bool OpenForDisregardForGC;
    FChunkedFixedUObjectArray ObjObjects;

   private:
    uint8_t UnknownData00[0x178];

   public:
    std::atomic<int32_t> MasterSerialNumber;
};

FUObjectArray GObjects;
```

Now some of these are just variables moved from other places - I suspect `FUObjectItem::Flags` is
where the 32 bits of `UObject::ObjectFlags` went for example. But the main point is this is just a
completely different data structure, it's a two level chunked array. No changing of field offsets is
going to fix interacting with this.

Another interesting thing to note is the two atomics. `MasterSerialNumber` is a global counter,
incremented every time an object is created, and copied to that object's `SerialNumber`. This is
used to implement weak object pointers - a weak pointer holds the object's index, and it's unique
serial number, which ensures that a different object hasn't taken the same slot. The problem here is
there's no such equivalent in Willow2, UE3 just doesn't have weak object pointers.

So how were these handled? Well, like before, it does half rely on the preprocessor. But since the
data structures are so dramatically different, we also use a wrapper type to make external usage
consistent.

```cpp
class GObjects {
   public:
#ifdef UE4
    using internal_type = FUObjectArray*;
#else
    using internal_type = TArray<UObject*>*;
#endif
   private:
    internal_type internal;

   public:
    struct Iterator;

    [[nodiscard]] size_t size(void) const;
    [[nodiscard]] UObject* obj_at(size_t idx) const;
    
    [[nodiscard]] Iterator begin(void) const;
    [[nodiscard]] static Iterator end(void);

    [[nodiscard]] UObject* get_weak_object(const FWeakObjectPtr* ptr) const;
    void set_weak_object(FWeakObjectPtr* ptr, const UObject* obj) const;
};
```

If these were changed to virtual functions, we could easily swap the internal type at runtime.

So the only question that remains is how do we deal with weak objects in UE3? Well, since they're
not implemented, there's no reason user code should ever call those function in a UE3 game. So we
just throw an exception.

# Borderlands 1, Orks Must Die Unchained
During the process of porting to Oak, some other people had taken a look at some other games.
trumank attempted porting the sdk to Orks Must Die Unchained, and later Ry0511 attempted porting it
to Borderlands 1. Both ran into a few layout differences, though there's nothing we haven't really
seen before, so I won't go into details.

But this is a problem since both of these are 32-bit UE3 games. Just like how I said before it's
wrong to treat UE4 as a monolith, it was wrong to treat UE3 as one too. But that's exactly what the
preprocessor stuff was doing, so it wasn't exactly easy to integrate these new layouts. Both of
these ended up living in their own forks. Pretty much the worst case scenario when our goal was one
dll to support everything.

# `UStruct`
So this one came as quite a surprise. In the original SDK, there was no special handling for
`UStruct`, we just assumed it was the same type across all of Willow2, and everything worked fine.
I came along, rewrote everything in `unrealsdk`, and created and released a new mod manger for Oak,
and everything worked fine. Then I spent a while rewriting the old Willow2 mod manager, released it,
...and it's hard crashing TPS on launch.

After spending a while debugging, I tracked it down to the following:
```diff
--- "a/.\\bl2.txt"
+++ "b/.\\tps.txt"
@@ -2,20 +2,20 @@
 class UStruct : public UField {
    private:
     uint8_t UnknownData00[0x8];
 
    public:
     UStruct* SuperField;
     UField* Children;
 
    private:
     uint16_t PropertySize;
     uint8_t UnknownData01[0x1A];
 
    public:
     UProperty* PropertyLink;
 
    private:
-    uint8_t UnknownData02[0x10];
+    uint8_t UnknownData02[0x4];
 
     TArray<UObject*> ScriptObjectReferences;
 };
```

The crash specifically was coming from trying to dereference `UClass::ClassDefaultObject`, where
`UClass` inherits from `UStruct`. Due to design mistakes I won't go into, in the original sdk you
essentially couldn't access this field, so no one had ever run into this before. What was more
shocking was `UFunction:FunctionFlags` - this field actually had a bit get set and cleared, in what
turns out was the complete wrong location, and everything still kept working.

Now luckily for us, just like `UProperty`, this is at the end of the object. But there's an extra
set of requirements here - we need a setter too. With a little bit of fiddling, I came up with this:

```cpp
class UStruct {
   private:
    static size_t class_size(void);  // Implemented using Unreal introspection

   protected:
    template <typename SubType, typename FieldType>
    [[nodiscard]] const FieldType& get_field(FieldType SubType::*field) const {
        ptrdiff_t offset = UStruct::class_size() - sizeof(UStruct);

        auto as_derived = reinterpret_cast<const SubType*>(this);
        auto field_ptr = &(as_derived->*field);

        auto adjusted_ptr = reinterpret_cast<uintptr_t>(field_ptr) + offset;
        return *reinterpret_cast<FieldType*>(adjusted_ptr);
    }
    template <typename SubType, typename FieldType>
    FieldType& get_field(FieldType SubType::*field) {
        return const_cast<FieldType&>(const_cast<const UStruct*>(this)->get_field(field));
    }
};


class UFunction : public UStruct {
   private:
    uint32_t FunctionFlags_internal;

   public:
    decltype(FunctionFlags_internal)& FunctionFlags(void) {
        return this->get_field(&UFunction::FunctionFlags_internal);
    }
    [[nodiscard]] const decltype(FunctionFlags_internal)& FunctionFlags(void) const {
        return this->get_field(&UFunction::FunctionFlags_internal);
    }
};
```

This is all the same logic as before, except this time we return a reference to the field, meaning
we can edit it. This makes for really nice readable code - and we can update existing code just by
adding a bracket pair.
```cpp
this->func->FunctionFlags() |= UFunction::FUNC_NATIVE;
```

An extra issue with this approach, on top of all those discussed for `UProperty`, is all the
repeated code to properly deal with the object's constness. If we have a non-const object, we want
to get a non-const reference back, so that we can edit it. If we have a const object, we obviously
can't do that, but we still want to get a const reference which we can read from.

So I hurridly swapped out all the fields on `UStruct` subclasses, following this pattern, and got a
new release fixing TPS. Then I got a report that the mod menu just plain didn't work. And they were
right. Whoops. I'd taken not crashing == works and didn't do a basic sanity check. So what was it
this time?

```diff
--- a/bl2.txt
+++ b/tps.txt
@@ -1,6 +1,6 @@
 class UClass : public UStruct { 
     uint8_t UnknownData00[0xCC];
     UObject* ClassDefaultObject;
-    uint8_t UnknownData01[0x48];
+    uint8_t UnknownData01[0x14];
     TArray<FImplementedInterface> Interfaces;
 };
```

I mentioned earlier that the old sdk never actually validated object properties. It certainly also
didn't validate interface properties, nothing ever checked this. Since the `Interfaces` field didn't
line up in TPS, when the mod menu tried setting an interface property, the new sdk assumed the
object didn't actually implement it, and threw an exception.

Now since this difference is in the middle of the object, we can't use the old strategy. How did I
get this working? Well, in the hurry to get a working release out, this went full circle, I used
some magic numbers.

```cpp
namespace {

const constexpr auto UCLASS_SIZE_TPS = 0x18C;
const constexpr auto UCLASS_INTERFACES_OFFSET_TPS = 0x160;

}  // namespace

[[nodiscard]] const decltype(UClass::Interfaces_internal)& UClass::Interfaces(void) const {
    static const auto use_tps_offset = this->Class->get_struct_size() == UCLASS_SIZE_TPS;

    if (use_tps_offset) {
        return *reinterpret_cast<decltype(UClass::Interfaces_internal)*>(
            reinterpret_cast<uintptr_t>(this) + UCLASS_INTERFACES_OFFSET_TPS);
    }

    return this->get_field(&UClass::Interfaces_internal);
}
```
