import tkinter as tk
from tkinter import messagebox
import time
import threading
from datetime import datetime, timedelta
import sys
import os

class PMPReminder:
    def __init__(self):
        self.root = tk.Tk()
        self.root.withdraw()  # Hide the main window
        
        # Set reminder interval (3 hours in seconds)
        self.interval = 3 * 60 * 60  # 3 hours
        
        # End of month deadline
        self.deadline = "January 31, 2025"
        
        # Start the reminder thread
        self.running = True
        self.reminder_thread = threading.Thread(target=self.reminder_loop, daemon=True)
        self.reminder_thread.start()
        
        # Create system tray icon (minimal UI)
        self.create_tray_window()
        
    def create_tray_window(self):
        # Create a small control window
        self.control_window = tk.Toplevel(self.root)
        self.control_window.title("PMP Reminder Running")
        self.control_window.geometry("300x150")
        
        # Calculate days until deadline
        deadline_date = datetime(2025, 1, 31, 23, 59, 59)
        days_left = (deadline_date - datetime.now()).days
        
        # Add labels
        tk.Label(self.control_window, text="PMP Continuing Education Reminder", 
                font=("Arial", 10, "bold")).pack(pady=10)
        tk.Label(self.control_window, text=f"Deadline: {self.deadline}", 
                font=("Arial", 9)).pack()
        tk.Label(self.control_window, text=f"Days remaining: {days_left}", 
                font=("Arial", 9), fg="red" if days_left < 7 else "blue").pack()
        tk.Label(self.control_window, text="Reminding every 3 hours", 
                font=("Arial", 9), fg="green").pack()
        
        # Add buttons
        button_frame = tk.Frame(self.control_window)
        button_frame.pack(pady=10)
        
        tk.Button(button_frame, text="Test Reminder", 
                 command=self.show_reminder, bg="lightblue").pack(side=tk.LEFT, padx=5)
        tk.Button(button_frame, text="Exit", 
                 command=self.quit_app, bg="lightcoral").pack(side=tk.LEFT, padx=5)
        
        # Minimize to taskbar by default
        self.control_window.iconify()
        
        # Handle window close
        self.control_window.protocol("WM_DELETE_WINDOW", self.hide_window)
        
    def hide_window(self):
        self.control_window.iconify()
        
    def quit_app(self):
        self.running = False
        self.root.quit()
        sys.exit()
        
    def show_reminder(self):
        # Calculate days until deadline
        deadline_date = datetime(2025, 1, 31, 23, 59, 59)
        time_left = deadline_date - datetime.now()
        days_left = time_left.days
        hours_left = time_left.seconds // 3600
        
        # Create urgency message based on time left
        if days_left < 1:
            urgency = "URGENT - DUE TODAY!"
            color = "#FF6B6B"  # Red
        elif days_left < 3:
            urgency = "VERY URGENT!"
            color = "#FFA500"  # Orange
        elif days_left < 7:
            urgency = "Time is running out!"
            color = "#FFD700"  # Gold
        else:
            urgency = "Don't forget!"
            color = "#FFEB3B"  # Yellow (classic post-it)
        
        # Create a custom post-it note style window
        self.create_postit_note(urgency, days_left, hours_left, color)
        
    def create_postit_note(self, urgency, days_left, hours_left, bg_color):
        # Create post-it note window
        postit = tk.Toplevel(self.root)
        postit.title("PMP Reminder")
        postit.geometry("300x250")
        postit.configure(bg=bg_color)
        
        # Remove window decorations for post-it look
        postit.overrideredirect(True)
        
        # Position in top right of screen
        postit.geometry("+{}+{}".format(postit.winfo_screenwidth()-320, 50))
        
        # Make it stay on top
        postit.attributes('-topmost', True)
        
        # Add shadow effect
        shadow_frame = tk.Frame(postit, bg="#666666", bd=0)
        shadow_frame.place(x=5, y=5, width=295, height=245)
        
        main_frame = tk.Frame(postit, bg=bg_color, bd=2, relief="raised")
        main_frame.place(x=0, y=0, width=295, height=240)
        
        # Post-it note content with handwritten-style font
        title_label = tk.Label(main_frame, text="📌 REMINDER 📌", 
                              font=("Comic Sans MS", 12, "bold"),
                              bg=bg_color, fg="#333333")
        title_label.pack(pady=10)
        
        urgency_label = tk.Label(main_frame, text=urgency,
                                font=("Comic Sans MS", 11, "bold"),
                                bg=bg_color, fg="#D32F2F")
        urgency_label.pack(pady=5)
        
        main_text = tk.Label(main_frame, 
                            text="PMP Continuing\nEducation",
                            font=("Comic Sans MS", 14, "bold"),
                            bg=bg_color, fg="#333333")
        main_text.pack(pady=10)
        
        deadline_text = tk.Label(main_frame,
                                text=f"Due: January 31, 2025",
                                font=("Comic Sans MS", 10),
                                bg=bg_color, fg="#333333")
        deadline_text.pack(pady=5)
        
        time_text = tk.Label(main_frame,
                            text=f"⏰ {days_left} days, {hours_left} hours left",
                            font=("Comic Sans MS", 10, "bold"),
                            bg=bg_color, fg="#B71C1C")
        time_text.pack(pady=5)
        
        # Close button (like crumpling the note)
        close_btn = tk.Button(main_frame, text="✕ Got it!",
                             font=("Comic Sans MS", 9),
                             command=postit.destroy,
                             bg="#FFFFFF", fg="#333333",
                             relief="flat", bd=1)
        close_btn.pack(pady=15)
        
        # Auto-close after 30 seconds
        postit.after(30000, postit.destroy)
        
        # Add some randomness to make it look handwritten
        import random
        for widget in main_frame.winfo_children():
            if isinstance(widget, tk.Label):
                angle = random.uniform(-1, 1)
                # Note: Rotation is complex in tkinter, skip for simplicity
            
    def reminder_loop(self):
        # Show initial reminder
        time.sleep(2)  # Wait 2 seconds before first reminder
        self.show_reminder()
        
        while self.running:
            # Wait for the interval
            time.sleep(self.interval)
            
            if self.running:
                # Check if we're still before the deadline
                deadline_date = datetime(2025, 1, 31, 23, 59, 59)
                if datetime.now() < deadline_date:
                    self.show_reminder()
                else:
                    messagebox.showinfo("Deadline Passed", 
                                      "The PMP Continuing Education deadline has passed. Reminder will stop.")
                    self.quit_app()
                    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = PMPReminder()
    app.run()