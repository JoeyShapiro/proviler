use std::thread;
use std::time::Duration;
use sysinfo::System;

pub struct Profiler {
    pid: sysinfo::Pid,
    interval: Duration,
    log: Vec<String>,
    sys: System,
}

impl Profiler {
    pub fn new(pid: u32, interval: Duration, capacity: usize) -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();

        Profiler {
            pid: sysinfo::Pid::from_u32(pid),
            interval,
            log: Vec::with_capacity(capacity),
            sys,
        }
    }

    pub fn start(&mut self) {
        // Initial refresh
        self.sys.refresh_all();

        loop {
            match self.step() {
                Ok(_) => {}
                Err(e) => {
                    eprintln!("Error: {}", e);
                    break;
                }
            }
        }
    }

    pub fn pause(&self) {}

    pub fn step(&mut self) -> Result<(), &'static str> {
        thread::sleep(self.interval);
        self.sys.refresh_all();

        if let Some(process) = self.sys.process(self.pid) {
            let message = format!(
                "{:.2} {}",
                process.cpu_usage(),
                process.virtual_memory() / 1024 / 1024 / 1024
            );

            if self.log.len() == self.log.capacity() {
                self.log.remove(0);
            }

            self.log.push(message);
            Ok(())
        } else {
            Err("process not found")
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {}
}
