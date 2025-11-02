use proviler::*; // or specific items

fn main() {
    let mut profiler = Profiler::new(12345, std::time::Duration::from_secs(1), 10);
    loop {
        profiler.step().unwrap();
    }
}
