use sysinfo::System;
use std::time::{Duration, Instant};

use crossterm::{
    event::{self, Event, KeyCode, KeyEvent},
    terminal::{disable_raw_mode, enable_raw_mode},
};
use clap::Parser;

#[derive(Parser)]
#[command(name = "proviler")]
#[command(about = "", long_about = None)]
struct Flags {
    /// Input file to process
    #[arg(short, long, default_value_t = 1000)]
    interval: u64,

    /// PID of the process to monitor
    /// cant seem to use -1. but hitting u32::max seems impossible
    /// doing an optional might be better, and cleaner. but could get messier and more complex
    #[arg(short, long, default_value_t = u32::MAX)]
    pid: u32,

    /// Enable verbose mode
    #[arg(short, long)]
    verbose: bool,

    /// Human readable output
    #[arg(short = 'u', long)]
    human: bool,

    /// Header row
    #[arg(short = 't', long)]
    header: bool,

    /// Watch for a program with a given name
    #[arg(short = 'w', long)]
    watch: String,
}

fn main() {
    let flags = Flags::parse();

    let mut sys = System::new_all();
    let interval = Duration::from_millis(flags.interval);
    let mut pid = sysinfo::Pid::from_u32(flags.pid);
    let now = std::time::SystemTime::now;
    let mut paused = false;
    let mut step = false;


    // TODO handle watching pid 0.
    let should_watch = if !flags.watch.is_empty() && flags.pid == 0 {
        true
    } else if flags.watch.is_empty() && flags.pid != 0 {
        false
    } else {
        eprintln!("Either --pid or --watch must be specified, but not both.");
        return;
    };

    if flags.header {
        print!("timestamp_ms cpu_usage mem");
        if flags.human {
            print!(" mem_units");
        }
        println!();
    }

    enable_raw_mode().unwrap();
    
    let mut lasttime = Instant::now();
    loop {
        // Poll for input with timeout
        if event::poll(interval).unwrap() {
            if let Event::Key(KeyEvent { code, .. }) = event::read().unwrap() {
                match code {
                    KeyCode::Char('q') => break,
                    KeyCode::Char(' ') => { 
                        paused = !paused; 
                        if flags.verbose {
                            if paused {
                                println!("paused\r");
                            } else {
                                println!("resumed\r");
                            }
                        }
                    }
                    KeyCode::Char('s') => step = true,
                    KeyCode::Char(ch) => println!("unknown command: '{}'\r", ch),
                    _ => {}
                }
            }
        }

        if lasttime.elapsed() < interval || (paused && !step) {
            continue;
        }
        lasttime = Instant::now();
        step = false;

        sys.refresh_all();

        if let Some(process) = sys.process(pid) {
            let vmem = if flags.human {
                let vmem_mr = process.memory(); // virtual_memory
                if vmem_mr >= 1 << 30 {
                    format!("{:.2} GiB", vmem_mr as f64 / (1 << 30) as f64)
                } else if vmem_mr >= 1 << 20 {
                    format!("{:.2} MiB", vmem_mr as f64 / (1 << 20) as f64)
                } else if vmem_mr >= 1 << 10 {
                    format!("{:.2} KiB", vmem_mr as f64 / (1 << 10) as f64)
                } else {
                    format!("{} B", vmem_mr)
                }
            } else {
                process.memory().to_string()
            };

            println!(
                "{} {:.2} {}\r",
                now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis(),
                process.cpu_usage(),
                vmem
            );
        } else if should_watch {
            // TODO maybe reset pid so i dont have an overlap
            // TODO use regex
            let procs: Vec<_> = sys.processes_by_name(std::ffi::OsStr::new(&flags.watch)).collect();
            // TODO handle multiple processes with the same name and watch all of them with pid in output
            if procs.is_empty() {
                if flags.verbose {
                    println!("Waiting for process '{}'...", flags.watch);
                }
            } else if procs.len() > 1 {
                todo!("Multiple processes with the same name are not supported yet");
            } else {
                if flags.verbose {
                    println!("Found process '{}' with PID {}", flags.watch, procs[0].pid());
                }
                pid = procs[0].pid();
            }
        } else {
            eprintln!("Process not found\r");
            break;
        }
    }

    disable_raw_mode().unwrap();
}
