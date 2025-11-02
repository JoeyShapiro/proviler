use std::thread;
use std::time::Duration;
use sysinfo::System;

use clap::Parser;

#[derive(Parser)]
#[command(name = "proviler")]
#[command(about = "", long_about = None)]
struct Flags {
    /// Input file to process
    #[arg(short, long, default_value_t = 1000)]
    interval: u64,

    /// PID of the process to monitor
    #[arg(short, long)]
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
}

fn main() {
    let flags = Flags::parse();

    let mut sys = System::new_all();
    let interval = Duration::from_millis(flags.interval);
    let pid = sysinfo::Pid::from_u32(flags.pid);
    let now = std::time::SystemTime::now;

    if flags.header {
        print!("timestamp_ms cpu_usage vmem");
        if flags.human {
            print!("(human)");
        }
        println!();
    }

    loop {
        thread::sleep(interval);
        sys.refresh_all();

        if let Some(process) = sys.process(pid) {
            let vmem = if flags.human {
                let vmem_mr = process.memory(); // virtual_memory
                if vmem_mr >= 1 << 30 {
                    format!("{:.2} GB", vmem_mr as f64 / (1 << 30) as f64)
                } else if vmem_mr >= 1 << 20 {
                    format!("{:.2} MB", vmem_mr as f64 / (1 << 20) as f64)
                } else if vmem_mr >= 1 << 10 {
                    format!("{:.2} KB", vmem_mr as f64 / (1 << 10) as f64)
                } else {
                    format!("{} B", vmem_mr)
                }
            } else {
                process.virtual_memory().to_string()
            };

            println!(
                "{} {:.2} {}",
                now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis(),
                process.cpu_usage(),
                vmem
            );
        } else {
            eprintln!("Process not found");
            break;
        }
    }
}
