# Proviler [PH]
This is a tool and VS Code extension that allows for profiling and logging the performance of an application.

## Background
I often keep task manager (or top, activity monitor, ...) open to measure the performance of my application I am currently working on. This is all well and good, but requires one more program I need for developing. I also need to find my program in the long list of programs being watched, and other little quirks. But I like my programs to be as efficient as possible, so I keep a close eye on the few numbers I can.

This tool is made for me, not you. With that being said I will listen to others and make it as functional as possible. My goal is that I will no longer require activity monitor for programming. It will not replace something like System Tools or GDB. But, if something is missing, I will add it. With that being said, there are some things I think I will be adding in the future.
- More stats (GPU, Power, Disk, ...)
- Fewer dependencies
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
- Supported Languages
  - [x] Go Lang
  - [x] C/C++
  - [x] Rust (CodeLLDB)
  - [ ] Python
  - [ ] Node
  - [ ] V Lang

## Todo
- put name and full path on hover
- support regex in name
- support multiple programs and use pid in table
- support watching children

## Usage
This program can be used as a standalone executable or as a VSCode extension.

### CLI
#### Monitor a Program
```sh
$ target/release/proviler -p 68096
1763768304660 0.00 1294336
1763768305691 0.00 1294336
1763768306720 0.00 1294336
1763768307750 0.00 1294336
```
#### Watch for a Program By Name
```sh
$ target/release/proviler -w a.out -v
Waiting for process 'a.out'...
Waiting for process 'a.out'...
Waiting for process 'a.out'...
Waiting for process 'a.out'...
Waiting for process 'a.out'...
Waiting for process 'a.out'...
Waiting for process 'a.out'...
Waiting for process 'a.out'...
Waiting for process 'a.out'...
# Started ./a.out
Found process 'a.out' with PID 71009
1763768488944 0.00 1294336
1763768489975 0.01 1294336
1763768491009 0.01 1294336
1763768492045 0.00 1294336
1763768493097 0.00 1294336
# Quit ./a.out
Waiting for process 'a.out'...
Waiting for process 'a.out'...
Waiting for process 'a.out'...
# Started new ./a.out
Found process 'a.out' with PID 71114
1763768498331 0.00 1294336
# Quite new ./a.out
Waiting for process 'a.out'...
Waiting for process 'a.out'...
```
#### Enable Header (some things dont have this)
```sh
$ target/release/proviler -w a.out -t
timestamp_ms cpu_usage mem
1763768583840 0.01 1294336
1763768584867 0.00 1294336
1763768585891 0.00 1294336
```
#### Human Readable Mode
```sh
$ target/release/proviler -w a.out -t -u
timestamp_ms cpu_usage mem mem_units
1763768605815 0.00 1.23 MiB
1763768606849 0.00 1.23 MiB
1763768607881 0.00 1.23 MiB
```

### Extension
The Graph is updated every second and stores the past 30 ticks.
It can stop and continue with pauses and steps.

## Build
```sh
just build
```
