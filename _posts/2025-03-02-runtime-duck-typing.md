---
title: Runtime Duck Typing in C++
description: Swapping between different object layouts at runtime.
---

C&#8288;+&#8288;+ is generally considered a statically typed language. Virtual functions and
templates blur the lines a bit, but you generally still need to know how all your types are laid out
at compile time. So what if you didn't?

[In the previous post]({{ "/posts/2025-01-15-unreal-object-layouts" | relative_url }}), I went over
how Unreal Engine's core class' layouts have changed over time, and how the Borderlands series'
modding sdk has historically handled these changes. In the sdk code, we don't actually particularly
care about the exact object layout, all we care about is that a field of the given name and type
exists. We can consider the different versions as different types, and we want to swap between them
using some form of duck typing.

```cpp
namespace bl2 {

class UClass : public UStruct { 
    uint8_t UnknownData00[0xCC];
    UObject* ClassDefaultObject;
    uint8_t UnknownData01[0x48];
    TArray<FImplementedInterface> Interfaces;
};

}

namespace tps {

class UClass : public UStruct { 
    uint8_t UnknownData00[0xCC];
    UObject* ClassDefaultObject;
    uint8_t UnknownData01[0x14];  // <-- different size
    TArray<FImplementedInterface> Interfaces;
};

}

bool UClass::implements(const UClass* interface) const {
    return std::ranges::any_of(this->Interfaces, // <-- pick the right one
                               [&](auto x) { return x.Class == interface; });
}
```

Now before continuing let's quickly answer why the obvious approaches won't work.

- Why is this post called *runtime* duck typing, why not just use `#if`s?

  One of the core tenents of the sdk's design is that all unreal properties are looked up at
  runtime, using Unreal's object introspection facilities<sup>1</sup>. This is in contrast to the
  "traditional" method of using an sdk generator to create a single static set of header files. This
  means the sdk accommodates game updates incredibly well, to the point that quite often, without
  doing any extra work, the exact same mod file works on multiple games in the series (at least
  those based on the same engine).
  
  So because we have great cross-game support, because we prefer to ship a single mod manager zip
  for multiple games where possible, and because the sdk is designed around looking stuff up at
  runtime anyway, it'd be preferable to also look up the core object layouts at runtime.
  
  <small>
  <sup>1</sup> The core fields we're talking about in this post aren't covered by this
               introspection.
  </small>

- Why not just use virtual functions, and have game specific subclasses?
  
  We don't own these types. They're all replicating existing unreal types already compiled into the
  engine. The sdk works by detouring base engine code in a few places, pulling some pointers out of
  the void, then casting them to our types, and assuming they line up. We can't add virtual
  functions because the virtual function tables are already compiled into the engine, and because
  it'd throw off all the field offsets.


# What worked
So to start with, let's go over what aspects of the historical solutions discussed in the previous
post worked well, and should be incorporated into the new one.

## Defining types using classes and inheritance
It feels a bit stupid pointing this one out when it's so obvious, but I have to. If I want to define
a class, it's nice defining it... as a class. I don't want to have to fill any big tables of magic
numbers for each field.

As a specific example, in the previous post we went over `UProperty::read_field`, which took member
pointers instead of relying on magic numbers - it even worked if you inherited through multiple
types.

```cpp
class UObjectProperty : public UProperty {
   private:
    UClass* PropertyClass;

   public:
    UClass* get_property_class(void) const {
        return this->read_field(&UObjectProperty::PropertyClass);
    }
};

class UClassProperty : public UObjectProperty {
   private:
    UClass* MetaClass;

   public:
    UClass* get_meta_class(void) const {
        return this->read_field(&UClassProperty::MetaClass);
    }
};
```

## Returning references to members
There were a small handful of places where the sdk needed to set a field whose offset changed
dynamically. Turning these into functions returning a reference lead to really nice semantics for
calling code - it's essentially the closest C&#8288;+&#8288;+ can get to a property.

```cpp
this->func->FunctionFlags() |= UFunction::FUNC_NATIVE;
```

While it's a lesser consideration, this also makes porting code quite easy, just add a pair of
brackets. Clang in fact detects this exact error case.

```
 /workspaces/unrealsdk/src/unrealsdk/game/bl3/console.cpp:166:19: error: reference to non-static member function must be called; did you mean to call it with no arguments?
  166 |         viewport->Class->find_prop_and_validate<UObjectProperty>(L"ViewportConsole"_fn);
      |         ~~~~~~~~~~^~~~~
      |                        ()
```

This project was always going to require a major version bump, a breaking change is ok, it's just
nice it's one relatively easy to fix.

## Wrapper types
For the cases where the internal unreal types where completely different, we used wrapper types, so
that all calling code used a common interface.

```cpp
class GObjects {
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

Since these are our own types, which we're never going to hand back to the engine, we can actually
get away with using virtual functions here, if required.

# Putting it together
Basically all the historical ways of dealing with these different object layouts boiled down to
working out what offset the field is supposed to be at, and then manually doing the pointer maths.
If we want to extend this system to cover every field, the obvious first idea is to just store every
field's offset.

After a bunch of experimenting, I came up with the following.
```cpp
using offset_type = uint16_t;

template <typename From, typename To>
using copy_cv = std::conditional_t<
    std::is_const_v<From>,
    std::add_const_t<std::conditional_t<std::is_volatile_v<From>, std::add_volatile_t<To>, To>>,
    /* align      */ std::conditional_t<std::is_volatile_v<From>, std::add_volatile_t<To>, To>>;

class UObject {
   public:
    struct Offsets {
        offset_type Class;
        offset_type Name;
        
        template <typename T>
        static constexpr Offsets from() {
            static_assert(offsetof(T, Class) < std::numeric_limits<offset_type>::max());
            static_assert(offsetof(T, Name) < std::numeric_limits<offset_type>::max());
            
            return {
                offsetof(T, Class),
                offsetof(T, Name),
            };
        }

        static offset_type get(offset_type Offsets::* field);
    };

    template <typename T>
    [[nodiscard]] copy_cv<T, UClass*>& Class(this T& self) {
        return *reinterpret_cast<copy_cv<T, UClass*>*>(reinterpret_cast<uintptr_t>(&self)
                                                       + Offsets::get(&Offsets::Class));
    }
    template <typename T>
    [[nodiscard]] copy_cv<T, FName>& Name(this T& self) {
        return *reinterpret_cast<copy_cv<T, FName>*>(reinterpret_cast<uintptr_t>(&self)
                                                     + Offsets::get(&Offsets::Name));
    }
};

struct OffsetList {
    UObject::Offsets UObject;

    template <typename T>
    static constexpr OffsetList from(void) {
        return {
            UObject::Offsets::from<typename T::UObject>(),
        };
    }
};
```

In each type, we add an `Offsets` struct, holding each field we're interested in. We also add a
helper function to generate the struct based off of a type. We then also add a reference getter for
each field, which gets the relevant offset and adds it to its pointer. These getters use
C&#8288;+&#8288;+&#8288;23's *deducing this* to automatically return a const reference on const
pointers. We then create an `OffsetList` type holding all sets of offsets, along with a templated
helper again.

Now in practice, to avoid copy paste errors, this is actually implemented using a number of X
macros - reflection isn't quite here yet, it would probably be cleaner. The actual code in each
type's header is a lot simpler.
```cpp
#define UNREALSDK_UOBJECT_FIELDS(X)   \
    X(object_flags_type, ObjectFlags) \
    X(int32_t, InternalIndex)         \
    X(UClass*, Class)                 \
    X(FName, Name)                    \
    X(UObject*, Outer)

    UNREALSDK_DEFINE_FIELDS_HEADER(UObject, UNREALSDK_UOBJECT_FIELDS);
```

So the next question is how do we actually swap the offsets out? The sdk already used an
`AbstractHook` type to swap handling of the engine functions it hooked. We can simply add on
returning the current offset list to its responsibilities.
```cpp
struct AbstractHook {
    // ...
    [[nodiscard]] virtual const OffsetList& get_offsets(void) const = 0;
};
```

Then each game can implement this by defining all its own types, and calling our templated helpers.
```cpp
namespace {

struct OffsetClasses {
    using UObject = bl2::UObject;
};

const auto OFFSETS = OffsetList::from<OffsetClasses>();

}  // namespace

[[nodiscard]] const OffsetList& BL2Hook::get_offsets(void) const {
    return OFFSETS;
}
```

And finally, we can implement `Offsets::get` with the following. This is it's own function,
implemented in the source file, mostly just to avoid recursive include issues.
```cpp
offset_type UObject::Offsets::get(offset_type UObject::Offsets::* field) { 
    return hook_instance->get_offsets().UObject.*field;
}
```

# Handling subclasses
So one annoyance with the above approach is to do with handling subclasses. Some subclasses are
relatively trivial, and have remained identical across all games.

```cpp
class UField : public UObject {
   public:
    UField* Next;
};
```

However, if the parent class has changed, that means even though the child class's definition hasn't
changed, the offsets of its fields certainly have. A parent class changing forces you to redefine
all its children. And `UObject` is *the* parent class, all other unreal object types inherit from
it. As of writing this the sdk currently includes 39 of its subclasses. We'd prefer not to need to
redeclare every other class if they're unchanged.

Instead, we can define a templated generic class, which inherits from the game-specific class.
```cpp
namespace generic {

template <typename T>
class UField : public T {
   public:
    UField* Next;
};

}  // namespace generic

struct OffsetClasses {
    using UObject = bl2::UObject;
    using UField = generic::UField<bl2::UObject>;
};
```

# Downsides
Now, while they sounded good in theory, as I was implementing the previous techniques, I came
across a few small downsides.

The first, and most obvious one: changing all members to functions is a breaking change, that
requires going through the entire codebase to fix every reference. I knew this, I pointed it out
earlier, but it was still quite annoying.

A more "real" problem is that turning the members into functions means you don't get to see them
while debugging anymore. If you need to see a specific field, you can manually call it's function,
it doesn't have side effects, but you just don't get to see a listing of all an object's members.
You can also manually cast to the game-specific version of the object, though that's normally more
typing.

But my biggest concern was performance. Obviously, adding any sort of dynamic typing will always
have worse performance than being able to read from a static offset. And the sdk already uses slow
runtime lookups for most unreal properties - but those lookups were exactly why I was worried, I
didn't want to make them too much worse. They work by iterating through several linked lists, and
comparing each object's name. With these changes, at minimum each iteration involves two virtual
function calls (next pointer + name), and a bit of pointer maths - and that's assuming perfect link
time optimization.

To test this, I ported `UObject`, `UField`, `UStruct`, and `UProperty` to the new system, then
upgraded [`pyunrealsdk`](https://github.com/bl-sdk/pyunrealsdk/) to support it. This is the main way
the sdk is actually used, from it's Python bindings, so better to benchmark there. I then manually
ran the following console commands from the main menu of BL3:
```py
py import timeit
py from mods_base import get_pc
py pc = get_pc()
py print(timeit.timeit(lambda: pc.OakCharacter, number=1000000))
py print(timeit.timeit(lambda: pc.ExecuteUbergraph, number=1000000))
```
`pc` was a `BP_MenuPlayerController_C`. Finding `ExecuteUbergraph` on this class iterates though 7
classes and 948 total fields. This is pretty much the worst case I could find. `OakCharacter` on the
other hand is the best case, it's the very first field.

|                    | Static typed | Duck typed | % slower |
|:-------------------|-------------:|-----------:|---------:|
| `OakCharacter`     |       1.507s |     1.582s |     5.0% |
| `ExecuteUbergraph` |       4.897s |     5.048s |     3.1% |

Seems acceptable enough, guess it's not a problem.

# An alternative approach
I did come up with a few concepts for an alternative approach while I was working on this. Since the
existing one is good enough, I haven't tried implementing it, there are still a number of open
questions, and I imagine it would probably be a lot more complex. But I figure it's worth putting
the idea out there.

Essentially, I imagine the "core" unreal types wouldn't have any members, and you'd instead be
forced to convert them to a "concrete", game specific, type before you can access them. A templated
lambda could be used to automatically handle the different object layouts - the implementation would
call it with a different templated type for each set of layouts.
```cpp
unrealsdk::to_concrete([]<typename T>(T::UObject* obj) {
    std::print("Object Name: {}", obj->Name);
}, obj);
```
This is making use of how templates are (compile-time) ducked typed to begin with, and then just
adding a runtime switch at the front.

Looking back at the downsides of the current approach, while it doesn't fully solve any of them,
this approach would help with all. You wouldn't need to update every single member access, but you
would still need to wrap larger code blocks. When debugging, the core types would still be unusable,
but in cases you want to see the members, it's likely you already converted your objects to a
concrete type, and within the lambda you could see all their members. And for performance, while
we'll still need to check which objects layouts to use once, at the start, it would only be that
once, the code within each lambda should compile similarly to before.

Now I like I said, there's still a number of open questions to this I haven't investigated.
- How do you keep a mapping between the core types and the concrete ones? If I have a core
  `UProperty*` I expect a `bl2::UProperty*` back.
- How can we convert multiple objects all at once?
- How does this interact with dependant types? For example, `UStruct` exposes a few iterators, is
  there a way to avoid needing to convert to a concrete type in every `Iterator::operator++` call?
- How do you structure this code without causing recursive includes?
