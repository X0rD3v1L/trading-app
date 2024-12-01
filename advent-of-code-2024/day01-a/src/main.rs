use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    let path = Path::new("src/input.txt");
    
    let file = File::open(&path)?;
    let reader = BufReader::new(file);

    let mut vector1 = Vec::new();
    let mut vector2 = Vec::new();

    for line in reader.lines() {
        let line = line?;
        let nums: Vec<i32> = line
            .split_whitespace()
            .map(|s| s.parse().expect("Failed to parse number"))
            .collect();
        
        if nums.len() == 2 {
            vector1.push(nums[0]);
            vector2.push(nums[1]);
        }
    }

    vector1.sort();
    vector2.sort();

    let sum_abs_diff: i32 = vector1
        .iter()
        .zip(vector2.iter())
        .map(|(a, b)| (a - b).abs())
        .sum();

    println!("Sum of Absolute Differences: {}", sum_abs_diff);

    Ok(())
}