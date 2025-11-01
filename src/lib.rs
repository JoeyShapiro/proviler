use std::thread;
use std::time::Duration;
use sysinfo::System;

pub fn profile(pid: u32, interval: Duration) {
    let mut sys = System::new_all();
    let pid = sysinfo::Pid::from_u32(pid);

    // Initial refresh
    sys.refresh_all();

    loop {
        thread::sleep(interval);
        sys.refresh_all();

        if let Some(process) = sys.process(pid) {
            println!(
                "CPU: {:.2}%, Memory: {} MB",
                process.cpu_usage(),
                process.virtual_memory() / 1024 / 1024 / 1024
            );
        } else {
            println!("Process not found");
            break;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        profile(60774, Duration::from_secs(1));
    }
}
