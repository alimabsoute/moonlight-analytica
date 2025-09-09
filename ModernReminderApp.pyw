import tkinter as tk
from tkinter import ttk, messagebox, colorchooser
import json
import time
import threading
from datetime import datetime, timedelta
import sys
import os
import math

class ModernReminderApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Modern Reminder App")
        self.root.geometry("600x800")
        self.setup_modern_theme()
        
        # Configuration file
        self.config_file = "reminder_config.json"
        self.load_config()
        
        # Theme settings
        self.dark_mode = False
        self.themes = {
            'light': {
                'bg': '#f8f9ff',
                'card_bg': '#ffffff',
                'text': '#2c3e50',
                'accent': '#3498db',
                'success': '#2ecc71',
                'danger': '#e74c3c',
                'warning': '#f39c12',
                'secondary': '#95a5a6',
                'border': '#e1e8ed'
            },
            'dark': {
                'bg': '#1a1a2e',
                'card_bg': '#16213e',
                'text': '#eee6ff',
                'accent': '#0f4c75',
                'success': '#27ae60',
                'danger': '#c0392b',
                'warning': '#e67e22',
                'secondary': '#7f8c8d',
                'border': '#2c3e50'
            }
        }
        
        # Reminder thread control
        self.running = False
        self.reminder_thread = None
        
        self.create_modern_interface()
        
    def setup_modern_theme(self):
        """Configure modern styling"""
        self.root.configure(bg='#f8f9ff')
        
        # Configure ttk styles
        style = ttk.Style()
        style.theme_use('clam')
        
        # Modern button style
        style.configure('Modern.TButton',
                       background='#3498db',
                       foreground='white',
                       borderwidth=0,
                       focuscolor='none',
                       relief='flat',
                       padding=(20, 10))
        
        style.map('Modern.TButton',
                 background=[('active', '#2980b9'),
                           ('pressed', '#21618c')])
        
        # Modern label frame
        style.configure('Card.TLabelframe',
                       background='white',
                       borderwidth=0,
                       relief='flat')
        
        style.configure('Card.TLabelframe.Label',
                       background='white',
                       foreground='#2c3e50',
                       font=('Segoe UI', 11, 'bold'))
    
    def load_config(self):
        """Load configuration from file or set defaults"""
        try:
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        except FileNotFoundError:
            self.config = {
                "reminder_title": "PMP Continuing Education",
                "reminder_message": "Complete your PMP requirements by end of January!",
                "deadline": "2025-01-31",
                "interval_hours": 5.5,
                "postit_color": "#FFEB3B",
                "urgent_color": "#FF6B6B",
                "text_color": "#333333",
                "font_family": "Segoe UI",
                "font_size": 12,
                "auto_close_seconds": 10,
                "position": "top-right",
                "show_countdown": True,
                "play_sound": False
            }
    
    def save_config(self):
        """Save configuration to file"""
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def get_theme(self):
        """Get current theme colors"""
        return self.themes['dark' if self.dark_mode else 'light']
    
    def create_modern_card(self, parent, title, **kwargs):
        """Create a modern card widget"""
        theme = self.get_theme()
        
        # Outer frame for shadow effect
        shadow_frame = tk.Frame(parent, bg='#00000010', height=2)
        shadow_frame.pack(fill='x', padx=22, pady=(0, 2))
        
        # Main card frame
        card_frame = tk.Frame(parent, 
                             bg=theme['card_bg'],
                             relief='flat',
                             bd=0)
        card_frame.pack(fill='x', padx=20, pady=(0, 15))
        
        # Card header
        header_frame = tk.Frame(card_frame, bg=theme['card_bg'])
        header_frame.pack(fill='x', padx=25, pady=(20, 10))
        
        title_label = tk.Label(header_frame, 
                              text=title,
                              font=('Segoe UI', 14, 'bold'),
                              bg=theme['card_bg'],
                              fg=theme['text'])
        title_label.pack(anchor='w')
        
        # Card content frame
        content_frame = tk.Frame(card_frame, bg=theme['card_bg'])
        content_frame.pack(fill='both', expand=True, padx=25, pady=(0, 20))
        
        return content_frame
    
    def create_modern_button(self, parent, text, command, style='primary', **kwargs):
        """Create a modern gradient button"""
        theme = self.get_theme()
        
        colors = {
            'primary': (theme['accent'], '#2980b9'),
            'success': (theme['success'], '#27ae60'),
            'danger': (theme['danger'], '#c0392b'),
            'warning': (theme['warning'], '#e67e22')
        }
        
        bg_color = colors.get(style, colors['primary'])[0]
        
        button = tk.Button(parent,
                          text=text,
                          command=command,
                          bg=bg_color,
                          fg='white',
                          font=('Segoe UI', 10, 'bold'),
                          relief='flat',
                          bd=0,
                          padx=20,
                          pady=8,
                          cursor='hand2',
                          **kwargs)
        
        # Hover effects
        def on_enter(e):
            button.configure(bg=colors.get(style, colors['primary'])[1])
        
        def on_leave(e):
            button.configure(bg=colors.get(style, colors['primary'])[0])
        
        button.bind("<Enter>", on_enter)
        button.bind("<Leave>", on_leave)
        
        return button
    
    def create_modern_interface(self):
        theme = self.get_theme()
        
        # Main container with padding
        main_container = tk.Frame(self.root, bg=theme['bg'])
        main_container.pack(fill='both', expand=True)
        
        # Header section
        header_frame = tk.Frame(main_container, bg=theme['bg'], height=80)
        header_frame.pack(fill='x', pady=(0, 20))
        header_frame.pack_propagate(False)
        
        # App title with modern styling
        title_frame = tk.Frame(header_frame, bg=theme['bg'])
        title_frame.pack(expand=True)
        
        title_label = tk.Label(title_frame,
                              text="Modern Reminder App",
                              font=('Segoe UI', 24, 'bold'),
                              bg=theme['bg'],
                              fg=theme['text'])
        title_label.pack(pady=(20, 5))
        
        subtitle_label = tk.Label(title_frame,
                                 text="Beautiful, customizable reminders for your important tasks",
                                 font=('Segoe UI', 11),
                                 bg=theme['bg'],
                                 fg=theme['secondary'])
        subtitle_label.pack()
        
        # Scrollable content area
        canvas = tk.Canvas(main_container, bg=theme['bg'], highlightthickness=0)
        scrollbar = ttk.Scrollbar(main_container, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg=theme['bg'])
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Reminder Settings Card
        reminder_content = self.create_modern_card(scrollable_frame, "📝 Reminder Settings")
        
        # Grid layout for form fields
        fields = [
            ("Reminder Title", "title_var", self.config["reminder_title"]),
            ("Message", "message_var", self.config["reminder_message"]),
            ("Deadline (YYYY-MM-DD)", "deadline_var", self.config["deadline"])
        ]
        
        self.vars = {}
        for i, (label, var_name, default) in enumerate(fields):
            tk.Label(reminder_content, text=label,
                    font=('Segoe UI', 10),
                    bg=theme['card_bg'],
                    fg=theme['text']).grid(row=i, column=0, sticky='w', pady=8, padx=(0, 15))
            
            self.vars[var_name] = tk.StringVar(value=default)
            entry = tk.Entry(reminder_content,
                           textvariable=self.vars[var_name],
                           font=('Segoe UI', 10),
                           bg='#f8f9ff',
                           fg=theme['text'],
                           relief='flat',
                           bd=5,
                           width=35)
            entry.grid(row=i, column=1, pady=8, sticky='ew')
        
        reminder_content.columnconfigure(1, weight=1)
        
        # Interval slider with modern styling
        tk.Label(reminder_content, text="Reminder Interval",
                font=('Segoe UI', 10),
                bg=theme['card_bg'],
                fg=theme['text']).grid(row=3, column=0, sticky='w', pady=8, padx=(0, 15))
        
        interval_frame = tk.Frame(reminder_content, bg=theme['card_bg'])
        interval_frame.grid(row=3, column=1, sticky='ew', pady=8)
        
        self.vars['interval_var'] = tk.DoubleVar(value=self.config["interval_hours"])
        interval_scale = tk.Scale(interval_frame,
                                from_=0.5, to=24, resolution=0.5,
                                orient="horizontal",
                                variable=self.vars['interval_var'],
                                bg=theme['card_bg'],
                                fg=theme['text'],
                                troughcolor='#e1e8ed',
                                activebackground=theme['accent'],
                                highlightthickness=0,
                                relief='flat',
                                length=200)
        interval_scale.pack(side="left")
        
        tk.Label(interval_frame, text="hours",
                font=('Segoe UI', 10),
                bg=theme['card_bg'],
                fg=theme['secondary']).pack(side="left", padx=(10, 0))
        
        # Appearance Card
        appearance_content = self.create_modern_card(scrollable_frame, "🎨 Appearance")
        
        # Color selection with modern color boxes
        colors_frame = tk.Frame(appearance_content, bg=theme['card_bg'])
        colors_frame.pack(fill='x', pady=10)
        
        self.create_color_picker(colors_frame, "Post-it Color", "postit_color", self.config["postit_color"])
        self.create_color_picker(colors_frame, "Urgent Color", "urgent_color", self.config["urgent_color"])
        
        # Font settings
        font_frame = tk.Frame(appearance_content, bg=theme['card_bg'])
        font_frame.pack(fill='x', pady=10)
        
        tk.Label(font_frame, text="Font Family",
                font=('Segoe UI', 10),
                bg=theme['card_bg'],
                fg=theme['text']).pack(anchor='w')
        
        self.vars['font_var'] = tk.StringVar(value=self.config["font_family"])
        font_combo = ttk.Combobox(font_frame,
                                 textvariable=self.vars['font_var'],
                                 values=["Segoe UI", "Arial", "Comic Sans MS", "Times New Roman", "Helvetica"],
                                 state="readonly",
                                 width=30)
        font_combo.pack(anchor='w', pady=(5, 0))
        
        # Control buttons with modern styling
        controls_content = self.create_modern_card(scrollable_frame, "🎮 Controls")
        
        buttons_frame = tk.Frame(controls_content, bg=theme['card_bg'])
        buttons_frame.pack(pady=10)
        
        self.start_btn = self.create_modern_button(buttons_frame, "▶️ Start Reminders", 
                                                  self.start_reminders, 'success')
        self.start_btn.pack(side='left', padx=(0, 10))
        
        self.stop_btn = self.create_modern_button(buttons_frame, "⏹️ Stop", 
                                                 self.stop_reminders, 'danger', state='disabled')
        self.stop_btn.pack(side='left', padx=(0, 10))
        
        self.create_modern_button(buttons_frame, "👀 Test Reminder", 
                                 self.test_reminder, 'primary').pack(side='left', padx=(0, 10))
        
        self.create_modern_button(buttons_frame, "💾 Save Settings", 
                                 self.save_settings, 'warning').pack(side='left')
        
        # Status with modern styling
        self.status_var = tk.StringVar(value="⏸️ Stopped")
        status_frame = tk.Frame(scrollable_frame, bg=theme['bg'])
        status_frame.pack(pady=20)
        
        status_card = tk.Frame(status_frame, bg=theme['card_bg'], padx=20, pady=10)
        status_card.pack()
        
        status_label = tk.Label(status_card,
                               textvariable=self.status_var,
                               font=('Segoe UI', 12, 'bold'),
                               bg=theme['card_bg'],
                               fg=theme['success'])
        status_label.pack()
        
        # Pack canvas and scrollbar
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Bind mousewheel to canvas
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        canvas.bind_all("<MouseWheel>", _on_mousewheel)
        
        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
    
    def create_color_picker(self, parent, label, config_key, default_color):
        """Create a modern color picker"""
        theme = self.get_theme()
        
        color_frame = tk.Frame(parent, bg=theme['card_bg'])
        color_frame.pack(side='left', padx=(0, 30))
        
        tk.Label(color_frame, text=label,
                font=('Segoe UI', 10),
                bg=theme['card_bg'],
                fg=theme['text']).pack(anchor='w')
        
        color_button = tk.Button(color_frame,
                               text="     ",
                               width=6, height=2,
                               bg=default_color,
                               relief='flat',
                               bd=0,
                               cursor='hand2',
                               command=lambda: self.choose_color(color_button, config_key))
        color_button.pack(pady=(5, 0))
        
        return color_button
    
    def choose_color(self, button, config_key):
        """Modern color chooser"""
        color = colorchooser.askcolor(initialcolor=self.config[config_key])[1]
        if color:
            button.configure(bg=color)
            self.config[config_key] = color
    
    def save_settings(self):
        """Save current settings to config"""
        self.config.update({
            "reminder_title": self.vars['title_var'].get(),
            "reminder_message": self.vars['message_var'].get(),
            "deadline": self.vars['deadline_var'].get(),
            "interval_hours": self.vars['interval_var'].get(),
            "font_family": self.vars['font_var'].get()
        })
        self.save_config()
        messagebox.showinfo("✅ Success", "Settings saved successfully!")
    
    def start_reminders(self):
        """Start the reminder system"""
        self.save_settings()
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
        self.save_settings()
        self.show_reminder()
    
    def show_reminder(self):
        """Display the modern post-it note reminder"""
        try:
            deadline_date = datetime.strptime(self.config["deadline"], "%Y-%m-%d")
            time_left = deadline_date - datetime.now()
            days_left = max(0, time_left.days)
            hours_left = max(0, time_left.seconds // 3600) if days_left >= 0 else 0
            
            self.create_modern_postit(days_left, hours_left)
        except ValueError:
            messagebox.showerror("Error", "Invalid deadline format. Use YYYY-MM-DD")
    
    def create_modern_postit(self, days_left, hours_left):
        """Create a beautiful modern post-it note"""
        postit = tk.Toplevel(self.root)
        postit.title("Reminder")
        postit.geometry("350x400")
        postit.configure(bg='#ffffff')
        postit.overrideredirect(True)
        postit.attributes('-topmost', True)
        
        # Position
        screen_w = postit.winfo_screenwidth()
        screen_h = postit.winfo_screenheight()
        x, y = (screen_w - 400, 50)  # Top right with margin
        postit.geometry(f"+{x}+{y}")
        
        # Create gradient background effect
        self.create_gradient_bg(postit, days_left)
        
        # Main content with glass morphism effect
        main_frame = tk.Frame(postit, bg='rgba(255,255,255,0.9)', bd=0)
        main_frame.place(x=15, y=15, width=320, height=370)
        
        # Header with icon
        header_frame = tk.Frame(main_frame, bg='transparent')
        header_frame.pack(pady=(30, 20))
        
        # Urgency indicator
        urgency_text, urgency_color = self.get_urgency_info(days_left)
        
        tk.Label(header_frame,
                text="🔔",
                font=('Segoe UI', 28),
                bg='transparent').pack()
        
        tk.Label(header_frame,
                text=urgency_text,
                font=('Segoe UI', 12, 'bold'),
                fg=urgency_color,
                bg='transparent').pack(pady=(10, 0))
        
        # Main content
        content_frame = tk.Frame(main_frame, bg='transparent')
        content_frame.pack(expand=True, fill='both', padx=30)
        
        tk.Label(content_frame,
                text=self.config["reminder_title"],
                font=('Segoe UI', 16, 'bold'),
                fg='#2c3e50',
                bg='transparent',
                wraplength=260).pack(pady=(0, 15))
        
        tk.Label(content_frame,
                text=self.config["reminder_message"],
                font=('Segoe UI', 11),
                fg='#34495e',
                bg='transparent',
                wraplength=260).pack(pady=(0, 20))
        
        # Countdown with modern styling
        if self.config["show_countdown"]:
            countdown_frame = tk.Frame(content_frame, bg='#ecf0f1', padx=20, pady=15)
            countdown_frame.pack(pady=(0, 20))
            
            tk.Label(countdown_frame,
                    text=f"{days_left}",
                    font=('Segoe UI', 24, 'bold'),
                    fg='#e74c3c',
                    bg='#ecf0f1').pack()
            
            tk.Label(countdown_frame,
                    text="days remaining",
                    font=('Segoe UI', 10),
                    fg='#7f8c8d',
                    bg='#ecf0f1').pack()
        
        # Close button with modern styling
        close_btn = tk.Button(content_frame,
                             text="Got it! ✨",
                             command=postit.destroy,
                             bg='#3498db',
                             fg='white',
                             font=('Segoe UI', 11, 'bold'),
                             relief='flat',
                             bd=0,
                             padx=30,
                             pady=10,
                             cursor='hand2')
        close_btn.pack(pady=(0, 20))
        
        # Hover effect for button
        def on_enter(e):
            close_btn.configure(bg='#2980b9')
        def on_leave(e):
            close_btn.configure(bg='#3498db')
        
        close_btn.bind("<Enter>", on_enter)
        close_btn.bind("<Leave>", on_leave)
        
        # Auto-close timer
        postit.after(self.config["auto_close_seconds"] * 1000, postit.destroy)
        
        # Fade in animation
        self.fade_in_animation(postit)
    
    def create_gradient_bg(self, window, days_left):
        """Create gradient background based on urgency"""
        if days_left < 1:
            # Red gradient for urgent
            gradient_colors = ['#ff6b6b', '#ee5a52']
        elif days_left < 3:
            # Orange gradient for very urgent
            gradient_colors = ['#ffa500', '#ff8c00']
        elif days_left < 7:
            # Yellow gradient for somewhat urgent
            gradient_colors = ['#ffd700', '#ffed4a']
        else:
            # Blue gradient for normal
            gradient_colors = ['#74b9ff', '#0984e3']
        
        # Create gradient effect (simplified)
        canvas = tk.Canvas(window, width=350, height=400, highlightthickness=0)
        canvas.pack(fill='both', expand=True)
        
        # Create gradient rectangles
        for i in range(100):
            y = i * 4
            # Interpolate between colors
            ratio = i / 100
            r1, g1, b1 = self.hex_to_rgb(gradient_colors[0])
            r2, g2, b2 = self.hex_to_rgb(gradient_colors[1])
            
            r = int(r1 + (r2 - r1) * ratio)
            g = int(g1 + (g2 - g1) * ratio)
            b = int(b1 + (b2 - b1) * ratio)
            
            color = f"#{r:02x}{g:02x}{b:02x}"
            canvas.create_rectangle(0, y, 350, y+4, fill=color, outline=color)
    
    def hex_to_rgb(self, hex_color):
        """Convert hex color to RGB"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def get_urgency_info(self, days_left):
        """Get urgency text and color based on days left"""
        if days_left < 1:
            return "🚨 URGENT - DUE TODAY!", "#e74c3c"
        elif days_left < 3:
            return "⚠️ VERY URGENT", "#e67e22"
        elif days_left < 7:
            return "⏰ Time is running out", "#f39c12"
        else:
            return "📝 Friendly Reminder", "#3498db"
    
    def fade_in_animation(self, window):
        """Simple fade in animation"""
        def fade():
            try:
                alpha = 0.0
                while alpha < 1.0:
                    window.attributes('-alpha', alpha)
                    alpha += 0.05
                    time.sleep(0.02)
            except:
                pass
        
        threading.Thread(target=fade, daemon=True).start()
    
    def reminder_loop(self):
        """Main reminder loop"""
        self.root.after(2000, self.show_reminder)
        
        while self.running:
            time.sleep(self.config["interval_hours"] * 3600)
            if self.running:
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
    app = ModernReminderApp()
    app.run()