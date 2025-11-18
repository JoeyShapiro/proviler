# Proviler [PH]
This is a tool and VS Code extension that allows for profiling and logging the performance of an application.

## Background
I often keep task manager (or top, activity monitor, ...) open to measure the performance of my application I am currently working on. This is all well and good, but requires one more program I need for developing. I also need to find my program in the long list of programs being watched, and other little quirks. But I like my programs to be as efficient as possible, so I keep a close eye on the few numbers I can.

This tool is made for me, not you. With that being said I will listen to others and make it as functional as possible. My goal is that I will no longer require activity monitor for programming. It will not replace something like System Tools or GDB. But, if something is missing, I will add it. With that being said, there are some things I think I will be adding in the future.
- More stats (GPU, Power, Disk, ...)
- Fewer dependencies
- watching for a program with by name
To name a few

### Story Time
Back when I first started programming casually, I learned about this new editor called VS Code. It seemed perfect for me, and way better than Visual Studio (for my workflow). It even supported modding.

My only problem was that it did not have that "Diagnostics Profiler" when you would run a program. It was the one thing that this almost perfect tool was missing. I was young and naïve. I thought it was impossible to make a graph like that in VS Code. It must require advanced programming to get those stats on the system. So I just accepted the loss and used VS Code.

Fast forward years later, I have matured and learned. The profiler is not actually that hard to make. Task Manager doesnt actually do that much, and most OSs hand out diagnostic and debug information like candy. Getting the information that the old VS Debugger would show is easy, and getting more advanced info is possible as well. You dont have to be a Microsoft program to have access to such utility.

I see this as my Homecoming. I am coming full circle from a problem that has always plagued me. It is a profiler tool that (I hope) allows for easy monitoring of the program you are working on. I also created a VS Code extension that uses this tool to monitor the current debugee and even has the graphs I was so fascinated with.

## Features
This is just like the old Visual Studio Usage graphs.
- machine and human readable usage logging
- really cool graphs during debugging
- cli supports any program with a pid
- VS Code extension (should) support any program / language that uses Debugger Adapter Protocol (DAP)

## Usage

### CLI

### Extension

## Build
```sh
just build
```
