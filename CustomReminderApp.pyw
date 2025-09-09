import tkinter as tk
from tkinter import ttk, messagebox, colorchooser
import json
import time
import threading
from datetime import datetime, timedelta
import sys
import os

class CustomReminderApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Custom Reminder App")
        self.root.geometry("500x650")
        self.root.configure(bg="#f0f0f0")
        
        # Configuration file
        self.config_file = "reminder_config.json"
        self.load_config()
        
        # Reminder thread control
        self.running = False
        self.reminder_thread = None
        
        self.create_main_interface()
        
    def load_config(self):
        """Load configuration from file or set defaults"""
        try:
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        except FileNotFoundError:
            self.config = {
                "reminder_title": "PMP Continuing Education",
                "reminder_message": "Complete your PMP requirements!",
                "deadline": "2025-01-31",
                "interval_hours": 3,
                "postit_color": "#FFEB3B",
                "urgent_color": "#FF6B6B",
                "text_color": "#333333",
                "font_family": "Comic Sans MS",
                "font_size": 12,
                "auto_close_seconds": 30,
                "position": "top-right",
                "show_countdown": True,
                "play_sound": False
            }
    
    def save_config(self):
        """Save configuration to file"""
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def create_main_interface(self):
        # Title
        title_frame = tk.Frame(self.root, bg="#f0f0f0")
        title_frame.pack(pady=10, fill="x")
        
        tk.Label(title_frame, text="🔔 Custom Reminder App", 
                font=("Arial", 16, "bold"), bg="#f0f0f0").pack()
        
        # Main content frame with scrollbar
        canvas = tk.Canvas(self.root, bg="#f0f0f0")
        scrollbar = ttk.Scrollbar(self.root, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Reminder Settings Section
        settings_frame = ttk.LabelFrame(scrollable_frame, text="📝 Reminder Settings", padding=15)
        settings_frame.pack(fill="x", padx=20, pady=10)
        
        # Title
        tk.Label(settings_frame, text="Reminder Title:").grid(row=0, column=0, sticky="w", pady=5)
        self.title_var = tk.StringVar(value=self.config["reminder_title"])
        tk.Entry(settings_frame, textvariable=self.title_var, width=40).grid(row=0, column=1, pady=5, padx=(10,0))
        
        # Message
        tk.Label(settings_frame, text="Message:").grid(row=1, column=0, sticky="w", pady=5)
        self.message_var = tk.StringVar(value=self.config["reminder_message"])
        tk.Entry(settings_frame, textvariable=self.message_var, width=40).grid(row=1, column=1, pady=5, padx=(10,0))
        
        # Deadline
        tk.Label(settings_frame, text="Deadline (YYYY-MM-DD):").grid(row=2, column=0, sticky="w", pady=5)
        self.deadline_var = tk.StringVar(value=self.config["deadline"])
        tk.Entry(settings_frame, textvariable=self.deadline_var, width=40).grid(row=2, column=1, pady=5, padx=(10,0))
        
        # Interval
        tk.Label(settings_frame, text="Reminder Interval (hours):").grid(row=3, column=0, sticky="w", pady=5)
        self.interval_var = tk.DoubleVar(value=self.config["interval_hours"])
        interval_frame = tk.Frame(settings_frame)
        interval_frame.grid(row=3, column=1, sticky="w", padx=(10,0))
        tk.Scale(interval_frame, from_=0.5, to=24, resolution=0.5, orient="horizontal",
                variable=self.interval_var, length=200).pack(side="left")
        tk.Label(interval_frame, text="hours").pack(side="left", padx=(5,0))
        
        # Appearance Section
        appearance_frame = ttk.LabelFrame(scrollable_frame, text="🎨 Appearance", padding=15)
        appearance_frame.pack(fill="x", padx=20, pady=10)
        
        # Colors
        colors_frame = tk.Frame(appearance_frame)
        colors_frame.grid(row=0, column=0, columnspan=2, sticky="w", pady=5)
        
        tk.Label(colors_frame, text="Post-it Color:").pack(side="left")
        self.color_button = tk.Button(colors_frame, text="   ", width=3, 
                                     bg=self.config["postit_color"],
                                     command=self.choose_postit_color)
        self.color_button.pack(side="left", padx=(5,15))
        
        tk.Label(colors_frame, text="Urgent Color:").pack(side="left")
        self.urgent_color_button = tk.Button(colors_frame, text="   ", width=3,
                                           bg=self.config["urgent_color"],
                                           command=self.choose_urgent_color)
        self.urgent_color_button.pack(side="left", padx=(5,0))
        
        # Font
        tk.Label(appearance_frame, text="Font Family:").grid(row=1, column=0, sticky="w", pady=5)
        self.font_var = tk.StringVar(value=self.config["font_family"])
        font_combo = ttk.Combobox(appearance_frame, textvariable=self.font_var, width=20,
                                 values=["Comic Sans MS", "Arial", "Times New Roman", "Helvetica", "Courier New"])
        font_combo.grid(row=1, column=1, sticky="w", padx=(10,0))
        
        tk.Label(appearance_frame, text="Font Size:").grid(row=2, column=0, sticky="w", pady=5)
        self.font_size_var = tk.IntVar(value=self.config["font_size"])
        tk.Scale(appearance_frame, from_=8, to=20, orient="horizontal",
                variable=self.font_size_var, length=200).grid(row=2, column=1, sticky="w", padx=(10,0))
        
        # Position
        tk.Label(appearance_frame, text="Position:").grid(row=3, column=0, sticky="w", pady=5)
        self.position_var = tk.StringVar(value=self.config["position"])
        position_combo = ttk.Combobox(appearance_frame, textvariable=self.position_var, width=20,
                                     values=["top-left", "top-right", "bottom-left", "bottom-right", "center"])
        position_combo.grid(row=3, column=1, sticky="w", padx=(10,0))
        
        # Behavior Section
        behavior_frame = ttk.LabelFrame(scrollable_frame, text="⚙️ Behavior", padding=15)
        behavior_frame.pack(fill="x", padx=20, pady=10)
        
        # Auto-close
        tk.Label(behavior_frame, text="Auto-close after (seconds):").grid(row=0, column=0, sticky="w", pady=5)
        self.auto_close_var = tk.IntVar(value=self.config["auto_close_seconds"])
        tk.Scale(behavior_frame, from_=10, to=120, orient="horizontal",
                variable=self.auto_close_var, length=200).grid(row=0, column=1, sticky="w", padx=(10,0))
        
        # Checkboxes
        self.countdown_var = tk.BooleanVar(value=self.config["show_countdown"])
        tk.Checkbutton(behavior_frame, text="Show countdown timer", 
                      variable=self.countdown_var).grid(row=1, column=0, columnspan=2, sticky="w", pady=5)
        
        self.sound_var = tk.BooleanVar(value=self.config["play_sound"])
        tk.Checkbutton(behavior_frame, text="Play notification sound", 
                      variable=self.sound_var).grid(row=2, column=0, columnspan=2, sticky="w", pady=5)
        
        # Control buttons
        control_frame = tk.Frame(scrollable_frame, bg="#f0f0f0")
        control_frame.pack(fill="x", padx=20, pady=20)
        
        button_frame = tk.Frame(control_frame, bg="#f0f0f0")
        button_frame.pack()
        
        self.start_btn = tk.Button(button_frame, text="▶️ Start Reminders", 
                                  command=self.start_reminders, bg="#4CAF50", fg="white", 
                                  font=("Arial", 10, "bold"), padx=20, pady=5)
        self.start_btn.pack(side="left", padx=5)
        
        self.stop_btn = tk.Button(button_frame, text="⏹️ Stop", 
                                 command=self.stop_reminders, bg="#f44336", fg="white",
                                 font=("Arial", 10, "bold"), padx=20, pady=5, state="disabled")
        self.stop_btn.pack(side="left", padx=5)
        
        tk.Button(button_frame, text="👀 Test Reminder", 
                 command=self.test_reminder, bg="#2196F3", fg="white",
                 font=("Arial", 10, "bold"), padx=20, pady=5).pack(side="left", padx=5)
        
        tk.Button(button_frame, text="💾 Save Settings", 
                 command=self.save_settings, bg="#FF9800", fg="white",
                 font=("Arial", 10, "bold"), padx=20, pady=5).pack(side="left", padx=5)
        
        # Status
        self.status_var = tk.StringVar(value="⏸️ Stopped")
        status_label = tk.Label(scrollable_frame, textvariable=self.status_var, 
                               font=("Arial", 12, "bold"), bg="#f0f0f0")
        status_label.pack(pady=10)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
    
    def choose_postit_color(self):
        color = colorchooser.askcolor(initialcolor=self.config["postit_color"])[1]
        if color:
            self.color_button.configure(bg=color)
            self.config["postit_color"] = color
    
    def choose_urgent_color(self):
        color = colorchooser.askcolor(initialcolor=self.config["urgent_color"])[1]
        if color:
            self.urgent_color_button.configure(bg=color)
            self.config["urgent_color"] = color
    
    def save_settings(self):
        """Save current settings to config"""
        self.config.update({
            "reminder_title": self.title_var.get(),
            "reminder_message": self.message_var.get(),
            "deadline": self.deadline_var.get(),
            "interval_hours": self.interval_var.get(),
            "font_family": self.font_var.get(),
            "font_size": self.font_size_var.get(),
            "auto_close_seconds": self.auto_close_var.get(),
            "position": self.position_var.get(),
            "show_countdown": self.countdown_var.get(),
            "play_sound": self.sound_var.get()
        })
        self.save_config()
        messagebox.showinfo("Settings Saved", "Your reminder settings have been saved!")
    
    def start_reminders(self):
        """Start the reminder system"""
        self.save_settings()  # Auto-save when starting
        self.running = True
        self.reminder_thread = threading.Thread(target=self.reminder_loop, daemon=True)
        self.reminder_thread.start()
        
        self.start_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        self.status_var.set(f"▶️ Running (every {self.config['interval_hours']} hours)")
    
    def stop_reminders(self):
        """Stop the reminder system"""
        self.running = False
        self.start_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self.status_var.set("⏸️ Stopped")
    
    def test_reminder(self):
        """Show a test reminder"""
        self.save_settings()  # Auto-save current settings
        self.show_reminder()
    
    def show_reminder(self):
        """Display the post-it note reminder"""
        try:
            deadline_date = datetime.strptime(self.config["deadline"], "%Y-%m-%d")
            time_left = deadline_date - datetime.now()
            days_left = max(0, time_left.days)
            hours_left = max(0, time_left.seconds // 3600) if days_left >= 0 else 0
            
            # Determine urgency and color
            if days_left < 1:
                urgency = "🚨 URGENT - DUE TODAY!"
                bg_color = self.config["urgent_color"]
            elif days_left < 3:
                urgency = "⚠️ VERY URGENT!"
                bg_color = self.config["urgent_color"]
            elif days_left < 7:
                urgency = "⏰ Time is running out!"
                bg_color = "#FFD700"  # Gold
            else:
                urgency = "📝 Reminder"
                bg_color = self.config["postit_color"]
            
            self.create_postit_note(urgency, days_left, hours_left, bg_color)
        except ValueError:
            messagebox.showerror("Error", "Invalid deadline format. Use YYYY-MM-DD")
    
    def create_postit_note(self, urgency, days_left, hours_left, bg_color):
        """Create and display the post-it note window"""
        postit = tk.Toplevel(self.root)
        postit.title("Reminder")
        postit.geometry("320x280")
        postit.configure(bg=bg_color)
        postit.overrideredirect(True)
        postit.attributes('-topmost', True)
        
        # Position based on user preference
        screen_w = postit.winfo_screenwidth()
        screen_h = postit.winfo_screenheight()
        
        positions = {
            "top-left": (50, 50),
            "top-right": (screen_w - 370, 50),
            "bottom-left": (50, screen_h - 330),
            "bottom-right": (screen_w - 370, screen_h - 330),
            "center": (screen_w // 2 - 160, screen_h // 2 - 140)
        }
        
        x, y = positions.get(self.config["position"], positions["top-right"])
        postit.geometry(f"+{x}+{y}")
        
        # Shadow effect
        shadow_frame = tk.Frame(postit, bg="#666666", bd=0)
        shadow_frame.place(x=5, y=5, width=315, height=275)
        
        main_frame = tk.Frame(postit, bg=bg_color, bd=2, relief="raised")
        main_frame.place(x=0, y=0, width=315, height=270)
        
        # Content
        font_family = self.config["font_family"]
        font_size = self.config["font_size"]
        
        tk.Label(main_frame, text="📌 REMINDER 📌", 
                font=(font_family, font_size + 2, "bold"),
                bg=bg_color, fg=self.config["text_color"]).pack(pady=10)
        
        tk.Label(main_frame, text=urgency,
                font=(font_family, font_size, "bold"),
                bg=bg_color, fg="#D32F2F").pack(pady=5)
        
        tk.Label(main_frame, text=self.config["reminder_title"],
                font=(font_family, font_size + 2, "bold"),
                bg=bg_color, fg=self.config["text_color"]).pack(pady=5)
        
        tk.Label(main_frame, text=self.config["reminder_message"],
                font=(font_family, font_size),
                bg=bg_color, fg=self.config["text_color"]).pack(pady=5)
        
        tk.Label(main_frame, text=f"Due: {self.config['deadline']}",
                font=(font_family, font_size - 1),
                bg=bg_color, fg=self.config["text_color"]).pack(pady=5)
        
        if self.config["show_countdown"]:
            tk.Label(main_frame, text=f"⏰ {days_left} days, {hours_left} hours left",
                    font=(font_family, font_size, "bold"),
                    bg=bg_color, fg="#B71C1C").pack(pady=5)
        
        tk.Button(main_frame, text="✕ Got it!",
                 font=(font_family, font_size - 2),
                 command=postit.destroy,
                 bg="#FFFFFF", fg=self.config["text_color"],
                 relief="flat", bd=1).pack(pady=10)
        
        # Play sound if enabled
        if self.config["play_sound"]:
            try:
                import winsound
                winsound.MessageBeep(winsound.MB_ICONEXCLAMATION)
            except:
                pass  # Sound not available
        
        # Auto-close
        postit.after(self.config["auto_close_seconds"] * 1000, postit.destroy)
    
    def reminder_loop(self):
        """Main reminder loop"""
        # Show immediate reminder
        self.root.after(2000, self.show_reminder)
        
        while self.running:
            time.sleep(self.config["interval_hours"] * 3600)
            if self.running:
                # Check if deadline passed
                try:
                    deadline_date = datetime.strptime(self.config["deadline"], "%Y-%m-%d")
                    if datetime.now() > deadline_date:
                        self.root.after(0, lambda: messagebox.showinfo("Deadline Passed", 
                                                     "The deadline has passed. Stopping reminders."))
                        self.root.after(0, self.stop_reminders)
                        break
                except ValueError:
                    pass
                
                self.root.after(0, self.show_reminder)
    
    def on_closing(self):
        """Handle app closing"""
        if self.running:
            if messagebox.askokcancel("Quit", "Stop reminders and quit the app?"):
                self.running = False
                self.root.destroy()
        else:
            self.root.destroy()
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = CustomReminderApp()
    app.run()