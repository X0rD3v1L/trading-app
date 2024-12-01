use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::collections::HashMap;
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

    let mut count_map = HashMap::new();

    for &elem in &vector2 {
        *count_map.entry(elem).or_insert(0) += 1;
    }

    let mut similarity_score = 0;


    for &elem in &vector1 {
        if let Some(&count) = count_map.get(&elem) {
            similarity_score += elem * count
        }
    }

    println!("Similarity score :: {}", similarity_score);

    Ok(())
}