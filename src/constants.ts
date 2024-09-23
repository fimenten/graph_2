// src/constants.ts

export const constants = {
    // Radius factors relative to the smaller edge of the canvas
    SMALL_RADIUS_FACTOR: 0.02,    // Example: 2% of the smaller edge
    MEDIUM_RADIUS_FACTOR: 0.04,   // Example: 4% of the smaller edge
    LARGE_RADIUS_FACTOR: 0.06,    // Example: 6% of the smaller edge
  
    // PageRank settings
    PAGE_RANK_DAMPING: 0.85,      // Damping factor for PageRank algorithm
    PAGE_RANK_ITERATIONS: 20,     // Number of iterations to run PageRank
  
    // Save interval in milliseconds (e.g., every 5 minutes)
    SAVE_INTERVAL_MS: 5 * 60 * 1000, // 300,000 ms
    ARROW_SIZE : 10
    // Additional constants can be added here as needed
  };
  