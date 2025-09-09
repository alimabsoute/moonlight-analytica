import tkinter as tk
from tkinter import messagebox, colorchooser
import json
import time
import threading
from datetime import datetime, timedelta

class SimpleReminderApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🔔 Reminder App")
        self.root.geometry("500x600")
        self.root.configure(bg='#f0f2f5')
        
        self.config_file = "reminder_config.json"
        self.load_config()
        
        self.running = False
        self.reminder_thread = None
        
        self.create_interface()
        
    def load_config(self):
        try:
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        except FileNotFoundError:
            self.config = {
                "reminder_title": "PMP Continuing Education",
                "reminder_message": "Complete your PMP requirements by end of January!",
                "deadline": "2025-01-31",
                "interval_hours": 5.5,
                "postit_color": "#4a90e2",
                "urgent_color": "#e74c3c",
                "auto_close_seconds": 10,
                "show_countdown": True
            }
    
    def save_config(self):
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def create_interface(self):
        # Header
        header = tk.Frame(self.root, bg='#4a90e2', height=80)
        header.pack(fill='x')
        header.pack_propagate(False)
        
        tk.Label(header, text="🔔 Beautiful Reminders", 
                font=('Arial', 18, 'bold'), bg='#4a90e2', fg='white').pack(pady=25)
        
        # Main content
        main = tk.Frame(self.root, bg='#f0f2f5', padx=30, pady=20)
        main.pack(fill='both', expand=True)
        
        # Settings section
        settings_frame = tk.LabelFrame(main, text="📝 Settings", font=('Arial', 12, 'bold'),
                                      bg='white', fg='#333', padx=20, pady=15, relief='flat', bd=1)
        settings_frame.pack(fill='x', pady=10)
        
        # Title
        tk.Label(settings_frame, text="Title:", bg='white', font=('Arial', 10, 'bold')).grid(row=0, column=0, sticky='w', pady=5)
        self.title_var = tk.StringVar(value=self.config["reminder_title"])
        tk.Entry(settings_frame, textvariable=self.title_var, width=50, font=('Arial', 10)).grid(row=0, column=1, pady=5, padx=(10,0))
        
        # Message
        tk.Label(settings_frame, text="Message:", bg='white', font=('Arial', 10, 'bold')).grid(row=1, column=0, sticky='w', pady=5)
        self.message_var = tk.StringVar(value=self.config["reminder_message"])
        tk.Entry(settings_frame, textvariable=self.message_var, width=50, font=('Arial', 10)).grid(row=1, column=1, pady=5, padx=(10,0))
        
        # Deadline
        tk.Label(settings_frame, text="Deadline:", bg='white', font=('Arial', 10, 'bold')).grid(row=2, column=0, sticky='w', pady=5)
        self.deadline_var = tk.StringVar(value=self.config["deadline"])
        tk.Entry(settings_frame, textvariable=self.deadline_var, width=50, font=('Arial', 10)).grid(row=2, column=1, pady=5, padx=(10,0))
        
        # Interval
        tk.Label(settings_frame, text="Hours:", bg='white', font=('Arial', 10, 'bold')).grid(row=3, column=0, sticky='w', pady=5)
        self.interval_var = tk.DoubleVar(value=self.config["interval_hours"])
        tk.Scale(settings_frame, from_=0.5, to=24, resolution=0.5, orient="horizontal",
                variable=self.interval_var, bg='white', length=300).grid(row=3, column=1, pady=5, padx=(10,0))
        
        # Colors
        colors_frame = tk.Frame(settings_frame, bg='white')
        colors_frame.grid(row=4, column=0, columnspan=2, pady=15)
        
        tk.Label(colors_frame, text="Normal Color:", bg='white', font=('Arial', 10)).pack(side='left')
        self.normal_color_btn = tk.Button(colors_frame, text="   ", width=4, height=2,
                                         bg=self.config["postit_color"],
                                         command=lambda: self.choose_color('postit_color', self.normal_color_btn))
        self.normal_color_btn.pack(side='left', padx=(5, 20))
        
        tk.Label(colors_frame, text="Urgent Color:", bg='white', font=('Arial', 10)).pack(side='left')
        self.urgent_color_btn = tk.Button(colors_frame, text="   ", width=4, height=2,
                                         bg=self.config["urgent_color"],
                                         command=lambda: self.choose_color('urgent_color', self.urgent_color_btn))
        self.urgent_color_btn.pack(side='left', padx=5)
        
        # Controls
        controls_frame = tk.LabelFrame(main, text="🎮 Controls", font=('Arial', 12, 'bold'),
                                      bg='white', fg='#333', padx=20, pady=15, relief='flat', bd=1)
        controls_frame.pack(fill='x', pady=10)
        
        # Status
        self.status_var = tk.StringVar(value="⏸️ Stopped")
        tk.Label(controls_frame, textvariable=self.status_var, font=('Arial', 12, 'bold'),
                bg='white', fg='#333').pack(pady=10)
        
        # Buttons
        btn_frame = tk.Frame(controls_frame, bg='white')
        btn_frame.pack(pady=10)
        
        self.start_btn = tk.Button(btn_frame, text="▶️ Start", command=self.start_reminders,
                                  bg='#27ae60', fg='white', font=('Arial', 10, 'bold'), padx=20, pady=5)
        self.start_btn.pack(side='left', padx=5)
        
        self.stop_btn = tk.Button(btn_frame, text="⏹️ Stop", command=self.stop_reminders,
                                 bg='#e74c3c', fg='white', font=('Arial', 10, 'bold'), padx=20, pady=5, state='disabled')
        self.stop_btn.pack(side='left', padx=5)
        
        tk.Button(btn_frame, text="👀 Test", command=self.test_reminder,
                 bg='#3498db', fg='white', font=('Arial', 10, 'bold'), padx=20, pady=5).pack(side='left', padx=5)
        
        tk.Button(btn_frame, text="💾 Save", command=self.save_settings,
                 bg='#f39c12', fg='white', font=('Arial', 10, 'bold'), padx=20, pady=5).pack(side='left', padx=5)
        
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
    
    def choose_color(self, config_key, button):
        color = colorchooser.askcolor(initialcolor=self.config[config_key])[1]
        if color:
            button.configure(bg=color)
            self.config[config_key] = color
    
    def save_settings(self):
        self.config.update({
            "reminder_title": self.title_var.get(),
            "reminder_message": self.message_var.get(),
            "deadline": self.deadline_var.get(),
            "interval_hours": self.interval_var.get()
        })
        self.save_config()
        messagebox.showinfo("Success", "Settings saved!")
    
    def start_reminders(self):
        self.save_settings()
        self.running = True
        self.reminder_thread = threading.Thread(target=self.reminder_loop, daemon=True)
        self.reminder_thread.start()
        
        self.start_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        self.status_var.set(f"▶️ Active (every {self.config['interval_hours']} hours)")
    
    def stop_reminders(self):
        self.running = False
        self.start_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self.status_var.set("⏸️ Stopped")
    
    def test_reminder(self):
        self.save_settings()
        self.show_reminder()
    
    def show_reminder(self):
        try:
            deadline_date = datetime.strptime(self.config["deadline"], "%Y-%m-%d")
            time_left = deadline_date - datetime.now()
            days_left = max(0, time_left.days)
            
            self.create_reminder_popup(days_left)
        except ValueError:
            messagebox.showerror("Error", "Invalid deadline format")
    
    def create_reminder_popup(self, days_left):
        popup = tk.Toplevel(self.root)
        popup.title("Reminder")
        popup.geometry("350x300")
        popup.overrideredirect(True)
        popup.attributes('-topmost', True)
        
        # Position in top-right
        screen_w = popup.winfo_screenwidth()
        popup.geometry(f"+{screen_w-370}+50")
        
        # Background color based on urgency
        if days_left < 1:
            bg_color = self.config["urgent_color"]
            urgency = "🚨 DUE TODAY!"
        elif days_left < 3:
            bg_color = "#ff6b35"
            urgency = "⚠️ VERY URGENT"
        elif days_left < 7:
            bg_color = "#ffa500"
            urgency = "⏰ Soon Due"
        else:
            bg_color = self.config["postit_color"]
            urgency = "📝 Reminder"
        
        popup.configure(bg=bg_color)
        
        # Content
        content = tk.Frame(popup, bg='white', padx=25, pady=20)
        content.pack(fill='both', expand=True, padx=10, pady=10)
        
        tk.Label(content, text="🔔", font=('Arial', 24), bg='white').pack(pady=(0, 10))
        
        tk.Label(content, text=urgency, font=('Arial', 11, 'bold'),
                fg=bg_color, bg='white').pack(pady=(0, 15))
        
        tk.Label(content, text=self.config["reminder_title"],
                font=('Arial', 14, 'bold'), bg='white', wraplength=300).pack(pady=(0, 10))
        
        tk.Label(content, text=self.config["reminder_message"],
                font=('Arial', 10), bg='white', wraplength=300).pack(pady=(0, 15))
        
        if self.config["show_countdown"]:
            tk.Label(content, text=f"{days_left} days left",
                    font=('Arial', 12, 'bold'), fg=bg_color, bg='white').pack(pady=(0, 15))
        
        tk.Button(content, text="Got it! ✨", command=popup.destroy,
                 bg=bg_color, fg='white', font=('Arial', 10, 'bold'),
                 padx=20, pady=5).pack()
        
        popup.after(self.config["auto_close_seconds"] * 1000, popup.destroy)
    
    def reminder_loop(self):
        self.root.after(3000, self.show_reminder)
        
        while self.running:
            time.sleep(self.config["interval_hours"] * 3600)
            if self.running:
                self.root.after(0, self.show_reminder)
    
    def on_closing(self):
        if self.running:
            if messagebox.askokcancel("Quit", "Stop reminders and quit?"):
                self.running = False
                self.root.destroy()
        else:
            self.root.destroy()
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = SimpleReminderApp()
    app.run()