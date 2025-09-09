import tkinter as tk
from tkinter import ttk, messagebox, colorchooser
import json
import time
import threading
from datetime import datetime, timedelta
import sys
import os

class BeautifulReminderApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("✨ Beautiful Reminder App")
        self.root.geometry("650x850")
        
        # Configuration file
        self.config_file = "reminder_config.json"
        self.load_config()
        
        # Modern color scheme
        self.colors = {
            'bg': '#f8fafc',
            'card': '#ffffff',
            'primary': '#3b82f6',
            'primary_hover': '#2563eb',
            'success': '#10b981',
            'success_hover': '#059669',
            'danger': '#ef4444',
            'danger_hover': '#dc2626',
            'warning': '#f59e0b',
            'warning_hover': '#d97706',
            'text_primary': '#1f2937',
            'text_secondary': '#6b7280',
            'border': '#e5e7eb',
            'accent': '#8b5cf6'
        }
        
        # Reminder thread control
        self.running = False
        self.reminder_thread = None
        
        self.setup_styles()
        self.create_beautiful_interface()
        
    def setup_styles(self):
        """Setup modern visual styles"""
        self.root.configure(bg=self.colors['bg'])
        
        # Configure ttk styles for modern look
        style = ttk.Style()
        style.theme_use('clam')
        
        # Modern button styles
        style.configure('Primary.TButton',
                       background=self.colors['primary'],
                       foreground='white',
                       borderwidth=0,
                       focuscolor='none',
                       relief='flat',
                       padding=(20, 12),
                       font=('Segoe UI', 10, 'bold'))
        
        style.map('Primary.TButton',
                 background=[('active', self.colors['primary_hover'])])
        
        # Modern combobox
        style.configure('Modern.TCombobox',
                       fieldbackground='white',
                       background='white',
                       borderwidth=1,
                       relief='solid')
    
    def load_config(self):
        """Load configuration from file"""
        try:
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        except FileNotFoundError:
            self.config = {
                "reminder_title": "PMP Continuing Education",
                "reminder_message": "Complete your PMP requirements by end of January!",
                "deadline": "2025-01-31",
                "interval_hours": 5.5,
                "postit_color": "#3b82f6",
                "urgent_color": "#ef4444",
                "text_color": "#ffffff",
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
    
    def create_modern_card(self, parent, title, icon=""):
        """Create a beautiful card with shadow effect"""
        # Outer container for shadow
        container = tk.Frame(parent, bg=self.colors['bg'])
        container.pack(fill='x', padx=20, pady=15)
        
        # Shadow frame
        shadow = tk.Frame(container, bg='#00000008', height=2)
        shadow.pack(fill='x', pady=(4, 0))
        
        # Main card
        card = tk.Frame(container, 
                       bg=self.colors['card'],
                       relief='solid',
                       bd=1,
                       highlightbackground=self.colors['border'])
        card.pack(fill='x')
        
        # Header
        header = tk.Frame(card, bg=self.colors['card'], height=60)
        header.pack(fill='x')
        header.pack_propagate(False)
        
        header_content = tk.Frame(header, bg=self.colors['card'])
        header_content.pack(expand=True, fill='both', padx=25, pady=15)
        
        title_label = tk.Label(header_content,
                              text=f"{icon} {title}",
                              font=('Segoe UI', 16, 'bold'),
                              bg=self.colors['card'],
                              fg=self.colors['text_primary'])
        title_label.pack(anchor='w')
        
        # Content area
        content = tk.Frame(card, bg=self.colors['card'])
        content.pack(fill='both', expand=True, padx=25, pady=(0, 25))
        
        return content
    
    def create_modern_input(self, parent, label, variable, width=400):
        """Create a modern input field"""
        # Label
        label_widget = tk.Label(parent,
                               text=label,
                               font=('Segoe UI', 11, 'bold'),
                               bg=self.colors['card'],
                               fg=self.colors['text_primary'])
        label_widget.pack(anchor='w', pady=(15, 5))
        
        # Input field with modern styling
        input_frame = tk.Frame(parent, bg=self.colors['card'])
        input_frame.pack(fill='x', pady=(0, 10))
        
        entry = tk.Entry(input_frame,
                        textvariable=variable,
                        font=('Segoe UI', 11),
                        bg='#f9fafb',
                        fg=self.colors['text_primary'],
                        relief='solid',
                        bd=2,
                        highlightthickness=0,
                        width=50)
        entry.pack(fill='x')
        
        # Focus effects
        def on_focus_in(e):
            entry.configure(bg='white', relief='solid', bd=2)
        def on_focus_out(e):
            entry.configure(bg='#f9fafb', relief='solid', bd=1)
        
        entry.bind('<FocusIn>', on_focus_in)
        entry.bind('<FocusOut>', on_focus_out)
        
        return entry
    
    def create_beautiful_button(self, parent, text, command, style='primary', icon=""):
        """Create a beautiful gradient-style button"""
        colors = {
            'primary': (self.colors['primary'], self.colors['primary_hover']),
            'success': (self.colors['success'], self.colors['success_hover']),
            'danger': (self.colors['danger'], self.colors['danger_hover']),
            'warning': (self.colors['warning'], self.colors['warning_hover'])
        }
        
        bg, hover_bg = colors.get(style, colors['primary'])
        
        button = tk.Button(parent,
                          text=f"{icon} {text}".strip(),
                          command=command,
                          bg=bg,
                          fg='white',
                          font=('Segoe UI', 11, 'bold'),
                          relief='flat',
                          bd=0,
                          padx=25,
                          pady=12,
                          cursor='hand2')
        
        # Hover effects
        def on_enter(e):
            button.configure(bg=hover_bg)
        def on_leave(e):
            button.configure(bg=bg)
        
        button.bind("<Enter>", on_enter)
        button.bind("<Leave>", on_leave)
        
        return button
    
    def create_beautiful_interface(self):
        # Main container
        main_container = tk.Frame(self.root, bg=self.colors['bg'])
        main_container.pack(fill='both', expand=True)
        
        # Beautiful header
        self.create_header(main_container)
        
        # Scrollable content
        canvas = tk.Canvas(main_container, bg=self.colors['bg'], highlightthickness=0)
        scrollbar = ttk.Scrollbar(main_container, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg=self.colors['bg'])
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Content sections
        self.create_reminder_section(scrollable_frame)
        self.create_appearance_section(scrollable_frame)
        self.create_controls_section(scrollable_frame)
        
        # Pack canvas
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Mouse wheel binding
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        canvas.bind_all("<MouseWheel>", _on_mousewheel)
        
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
    
    def create_header(self, parent):
        """Create beautiful header"""
        header = tk.Frame(parent, bg='#3b82f6', height=120)
        header.pack(fill='x')
        header.pack_propagate(False)
        
        content = tk.Frame(header, bg='#3b82f6')
        content.pack(expand=True, fill='both')
        
        # Title
        title = tk.Label(content,
                        text="✨ Beautiful Reminder App",
                        font=('Segoe UI', 28, 'bold'),
                        bg='#3b82f6',
                        fg='white')
        title.pack(pady=(20, 5))
        
        subtitle = tk.Label(content,
                           text="Elegant reminders that you'll actually want to see",
                           font=('Segoe UI', 12),
                           bg='#3b82f6',
                           fg='#dbeafe')
        subtitle.pack()
    
    def create_reminder_section(self, parent):
        """Create reminder settings section"""
        content = self.create_modern_card(parent, "Reminder Settings", "⚙️")
        
        # Variables
        self.title_var = tk.StringVar(value=self.config["reminder_title"])
        self.message_var = tk.StringVar(value=self.config["reminder_message"])
        self.deadline_var = tk.StringVar(value=self.config["deadline"])
        self.interval_var = tk.DoubleVar(value=self.config["interval_hours"])
        
        # Input fields
        self.create_modern_input(content, "Reminder Title", self.title_var)
        self.create_modern_input(content, "Message", self.message_var)
        self.create_modern_input(content, "Deadline (YYYY-MM-DD)", self.deadline_var)
        
        # Interval slider
        tk.Label(content,
                text="Reminder Interval",
                font=('Segoe UI', 11, 'bold'),
                bg=self.colors['card'],
                fg=self.colors['text_primary']).pack(anchor='w', pady=(15, 5))
        
        interval_frame = tk.Frame(content, bg=self.colors['card'])
        interval_frame.pack(fill='x', pady=(0, 10))
        
        scale = tk.Scale(interval_frame,
                        from_=0.5, to=24, resolution=0.5,
                        orient="horizontal",
                        variable=self.interval_var,
                        bg=self.colors['card'],
                        fg=self.colors['text_primary'],
                        troughcolor='#e5e7eb',
                        activebackground=self.colors['primary'],
                        highlightthickness=0,
                        relief='flat',
                        font=('Segoe UI', 10),
                        length=300)
        scale.pack(anchor='w')
        
        tk.Label(interval_frame,
                text="hours",
                font=('Segoe UI', 10),
                bg=self.colors['card'],
                fg=self.colors['text_secondary']).pack(anchor='w')
    
    def create_appearance_section(self, parent):
        """Create appearance settings"""
        content = self.create_modern_card(parent, "Appearance", "🎨")
        
        # Color pickers
        colors_frame = tk.Frame(content, bg=self.colors['card'])
        colors_frame.pack(fill='x', pady=15)
        
        # Normal color
        self.create_color_section(colors_frame, "Normal Color", "postit_color", 0)
        # Urgent color  
        self.create_color_section(colors_frame, "Urgent Color", "urgent_color", 1)
        
        # Font selection
        tk.Label(content,
                text="Font Family",
                font=('Segoe UI', 11, 'bold'),
                bg=self.colors['card'],
                fg=self.colors['text_primary']).pack(anchor='w', pady=(15, 5))
        
        self.font_var = tk.StringVar(value=self.config["font_family"])
        font_combo = ttk.Combobox(content,
                                 textvariable=self.font_var,
                                 values=["Segoe UI", "Arial", "Comic Sans MS", "Times New Roman", "Helvetica"],
                                 state="readonly",
                                 font=('Segoe UI', 11),
                                 width=30,
                                 style='Modern.TCombobox')
        font_combo.pack(anchor='w', pady=(0, 10))
    
    def create_color_section(self, parent, label, config_key, column):
        """Create a color picker section"""
        section = tk.Frame(parent, bg=self.colors['card'])
        section.grid(row=0, column=column, padx=(0, 30), sticky='nw')
        
        tk.Label(section,
                text=label,
                font=('Segoe UI', 11, 'bold'),
                bg=self.colors['card'],
                fg=self.colors['text_primary']).pack(anchor='w')
        
        # Color display button
        color_button = tk.Button(section,
                               text="     ",
                               width=8, height=3,
                               bg=self.config[config_key],
                               relief='solid',
                               bd=2,
                               cursor='hand2',
                               command=lambda: self.choose_color(color_button, config_key))
        color_button.pack(pady=(8, 0))
        
        # Color value label
        tk.Label(section,
                text=self.config[config_key],
                font=('Segoe UI', 9),
                bg=self.colors['card'],
                fg=self.colors['text_secondary']).pack(pady=(5, 0))
    
    def create_controls_section(self, parent):
        """Create control buttons section"""
        content = self.create_modern_card(parent, "Controls", "🎮")
        
        # Status display
        status_frame = tk.Frame(content, bg='#f3f4f6', padx=20, pady=15)
        status_frame.pack(fill='x', pady=(0, 20))
        
        self.status_var = tk.StringVar(value="⏸️ Stopped")
        status_label = tk.Label(status_frame,
                               textvariable=self.status_var,
                               font=('Segoe UI', 14, 'bold'),
                               bg='#f3f4f6',
                               fg=self.colors['text_primary'])
        status_label.pack()
        
        # Buttons
        buttons_frame = tk.Frame(content, bg=self.colors['card'])
        buttons_frame.pack(pady=10)
        
        self.start_btn = self.create_beautiful_button(buttons_frame, "Start Reminders", 
                                                     self.start_reminders, 'success', '▶️')
        self.start_btn.pack(side='left', padx=(0, 15))
        
        self.stop_btn = self.create_beautiful_button(buttons_frame, "Stop", 
                                                    self.stop_reminders, 'danger', '⏹️')
        self.stop_btn.pack(side='left', padx=(0, 15))
        self.stop_btn.configure(state='disabled', bg='#9ca3af')
        
        self.create_beautiful_button(buttons_frame, "Test Reminder", 
                                   self.test_reminder, 'primary', '👀').pack(side='left', padx=(0, 15))
        
        self.create_beautiful_button(buttons_frame, "Save Settings", 
                                   self.save_settings, 'warning', '💾').pack(side='left')
    
    def choose_color(self, button, config_key):
        """Color chooser dialog"""
        color = colorchooser.askcolor(initialcolor=self.config[config_key])[1]
        if color:
            button.configure(bg=color)
            self.config[config_key] = color
            # Update the label below the button
            for widget in button.master.winfo_children():
                if isinstance(widget, tk.Label) and widget != button.master.winfo_children()[0]:
                    widget.configure(text=color)
    
    def save_settings(self):
        """Save settings"""
        self.config.update({
            "reminder_title": self.title_var.get(),
            "reminder_message": self.message_var.get(),
            "deadline": self.deadline_var.get(),
            "interval_hours": self.interval_var.get(),
            "font_family": self.font_var.get()
        })
        self.save_config()
        
        # Success animation
        success_popup = tk.Toplevel(self.root)
        success_popup.title("Success")
        success_popup.geometry("300x150")
        success_popup.configure(bg='white')
        success_popup.overrideredirect(True)
        success_popup.attributes('-topmost', True)
        
        # Center it
        x = self.root.winfo_x() + self.root.winfo_width()//2 - 150
        y = self.root.winfo_y() + self.root.winfo_height()//2 - 75
        success_popup.geometry(f"+{x}+{y}")
        
        tk.Label(success_popup, text="✅", font=('Segoe UI', 40), bg='white').pack(pady=(20, 5))
        tk.Label(success_popup, text="Settings Saved!", font=('Segoe UI', 12, 'bold'), bg='white').pack()
        
        success_popup.after(1500, success_popup.destroy)
    
    def start_reminders(self):
        """Start reminders"""
        self.save_settings()
        self.running = True
        self.reminder_thread = threading.Thread(target=self.reminder_loop, daemon=True)
        self.reminder_thread.start()
        
        self.start_btn.configure(state="disabled", bg='#9ca3af')
        self.stop_btn.configure(state="normal", bg=self.colors['danger'])
        self.status_var.set(f"▶️ Active (every {self.config['interval_hours']} hours)")
    
    def stop_reminders(self):
        """Stop reminders"""
        self.running = False
        self.start_btn.configure(state="normal", bg=self.colors['success'])
        self.stop_btn.configure(state="disabled", bg='#9ca3af')
        self.status_var.set("⏸️ Stopped")
    
    def test_reminder(self):
        """Test reminder"""
        self.save_settings()
        self.show_reminder()
    
    def show_reminder(self):
        """Show beautiful reminder"""
        try:
            deadline_date = datetime.strptime(self.config["deadline"], "%Y-%m-%d")
            time_left = deadline_date - datetime.now()
            days_left = max(0, time_left.days)
            hours_left = max(0, time_left.seconds // 3600) if days_left >= 0 else 0
            
            self.create_beautiful_reminder(days_left, hours_left)
        except ValueError:
            messagebox.showerror("Error", "Invalid deadline format. Use YYYY-MM-DD")
    
    def create_beautiful_reminder(self, days_left, hours_left):
        """Create the beautiful reminder popup"""
        reminder = tk.Toplevel(self.root)
        reminder.title("Reminder")
        reminder.geometry("380x450")
        reminder.overrideredirect(True)
        reminder.attributes('-topmost', True)
        
        # Position
        screen_w = reminder.winfo_screenwidth()
        screen_h = reminder.winfo_screenheight()
        x, y = (screen_w - 400, 100)
        reminder.geometry(f"+{x}+{y}")
        
        # Determine colors based on urgency
        if days_left < 1:
            bg_color = '#fee2e2'
            accent_color = '#ef4444'
            urgency_text = "🚨 DUE TODAY!"
        elif days_left < 3:
            bg_color = '#fed7aa'
            accent_color = '#f97316'
            urgency_text = "⚠️ VERY URGENT"
        elif days_left < 7:
            bg_color = '#fef3c7'
            accent_color = '#f59e0b'
            urgency_text = "⏰ Soon Due"
        else:
            bg_color = self.config['postit_color'] + '20'  # Add transparency effect
            accent_color = self.config['postit_color']
            urgency_text = "📝 Reminder"
        
        # Main background
        reminder.configure(bg=bg_color)
        
        # Top accent bar
        accent_bar = tk.Frame(reminder, bg=accent_color, height=6)
        accent_bar.pack(fill='x')
        
        # Content frame
        content = tk.Frame(reminder, bg='white', padx=30, pady=25)
        content.pack(fill='both', expand=True, padx=8, pady=(0, 8))
        
        # Header
        tk.Label(content, text="🔔", font=('Segoe UI', 32), bg='white').pack(pady=(0, 10))
        
        tk.Label(content,
                text=urgency_text,
                font=('Segoe UI', 12, 'bold'),
                fg=accent_color,
                bg='white').pack(pady=(0, 20))
        
        # Title
        tk.Label(content,
                text=self.config["reminder_title"],
                font=('Segoe UI', 18, 'bold'),
                fg='#1f2937',
                bg='white',
                wraplength=320).pack(pady=(0, 15))
        
        # Message
        tk.Label(content,
                text=self.config["reminder_message"],
                font=('Segoe UI', 12),
                fg='#4b5563',
                bg='white',
                wraplength=320).pack(pady=(0, 20))
        
        # Countdown box
        if self.config["show_countdown"]:
            countdown_frame = tk.Frame(content, bg='#f3f4f6', padx=20, pady=15)
            countdown_frame.pack(pady=(0, 25))
            
            tk.Label(countdown_frame,
                    text=str(days_left),
                    font=('Segoe UI', 32, 'bold'),
                    fg=accent_color,
                    bg='#f3f4f6').pack()
            
            tk.Label(countdown_frame,
                    text="days remaining",
                    font=('Segoe UI', 11),
                    fg='#6b7280',
                    bg='#f3f4f6').pack()
        
        # Close button
        close_btn = tk.Button(content,
                             text="Got it! ✨",
                             command=reminder.destroy,
                             bg=accent_color,
                             fg='white',
                             font=('Segoe UI', 12, 'bold'),
                             relief='flat',
                             bd=0,
                             padx=40,
                             pady=12,
                             cursor='hand2')
        close_btn.pack()
        
        # Auto close
        reminder.after(self.config["auto_close_seconds"] * 1000, reminder.destroy)
        
        # Fade in effect
        reminder.attributes('-alpha', 0.0)
        self.fade_in(reminder)
    
    def fade_in(self, window):
        """Fade in animation"""
        alpha = 0.0
        def animate():
            nonlocal alpha
            if alpha < 1.0:
                alpha += 0.05
                try:
                    window.attributes('-alpha', alpha)
                    window.after(20, animate)
                except:
                    pass
        animate()
    
    def reminder_loop(self):
        """Reminder loop"""
        self.root.after(3000, self.show_reminder)  # Show first reminder after 3 seconds
        
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
        """Handle closing"""
        if self.running:
            if messagebox.askokcancel("Quit", "Stop reminders and quit?"):
                self.running = False
                self.root.destroy()
        else:
            self.root.destroy()
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = BeautifulReminderApp()
    app.run()