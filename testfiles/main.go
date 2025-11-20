package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Println("Hello, World!")
	fmt.Println("")
	fmt.Println("")
	for {
		// fmt.Println("Infinite Loop")
		time.Sleep(1 * time.Second)
	}
}
