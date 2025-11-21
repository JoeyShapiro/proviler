use core::time;
use std::thread;

fn main() {
    println!("Hello, world!");
    loop {
        thread::sleep(time::Duration::from_secs(1));
    }
}