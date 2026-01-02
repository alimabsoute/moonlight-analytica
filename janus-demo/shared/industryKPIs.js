/**
 * Industry-Specific KPI Definitions
 * 12 industry presets with 15+ KPIs each
 * Total: 205 KPIs (25 core + 180 industry-specific)
 */

// ============================================
// CORE UNIVERSAL KPIs (25 metrics - all industries)
// ============================================

export const CORE_KPIS = {
  trafficFlow: [
    { id: 'current_occupancy', label: 'Current Occupancy', unit: 'people', description: 'People in space right now', category: 'traffic' },
    { id: 'peak_occupancy', label: 'Peak Occupancy', unit: 'people', description: 'Highest count today', category: 'traffic' },
    { id: 'total_visitors', label: 'Total Visitors', unit: 'people', description: 'Unique visitors today', category: 'traffic' },
    { id: 'entries_hour', label: 'Entries This Hour', unit: 'people/hr', description: 'Inbound traffic rate', category: 'traffic' },
    { id: 'exits_hour', label: 'Exits This Hour', unit: 'people/hr', description: 'Outbound traffic rate', category: 'traffic' },
    { id: 'net_flow', label: 'Net Flow', unit: 'people', description: 'Entries minus exits', category: 'traffic' },
    { id: 'traffic_velocity', label: 'Traffic Velocity', unit: 'per min', description: 'Entries per minute', category: 'traffic' },
    { id: 'occupancy_rate', label: 'Occupancy Rate', unit: '%', description: 'Current / Capacity', category: 'traffic' }
  ],
  dwellEngagement: [
    { id: 'avg_dwell', label: 'Avg Dwell Time', unit: 'min', description: 'Mean time spent', category: 'engagement' },
    { id: 'median_dwell', label: 'Median Dwell Time', unit: 'min', description: 'Middle value (less skewed)', category: 'engagement' },
    { id: 'bounce_rate', label: 'Bounce Rate', unit: '%', description: 'Left within 1 minute', category: 'engagement' },
    { id: 'engagement_rate', label: 'Engagement Rate', unit: '%', description: 'Stayed 5+ minutes', category: 'engagement' },
    { id: 'deep_engagement', label: 'Deep Engagement', unit: '%', description: 'Stayed 15+ minutes', category: 'engagement' },
    { id: 'session_duration', label: 'Session Duration', unit: 'min', description: 'Avg total visit length', category: 'engagement' },
    { id: 'return_rate', label: 'Return Rate', unit: '%', description: 'Repeat visitors today', category: 'engagement' }
  ],
  conversionRevenue: [
    { id: 'conversion_rate', label: 'Conversion Rate', unit: '%', description: 'Visitors who purchased', category: 'conversion' },
    { id: 'cart_abandonment', label: 'Cart Abandonment', unit: '%', description: 'Reached checkout but left', category: 'conversion' },
    { id: 'avg_transaction', label: 'Avg Transaction Value', unit: '$', description: 'Revenue per conversion', category: 'conversion' },
    { id: 'revenue_per_visitor', label: 'Revenue Per Visitor', unit: '$', description: 'Total revenue / visitors', category: 'conversion' },
    { id: 'conversion_velocity', label: 'Conversion Velocity', unit: 'per hr', description: 'Conversions per hour', category: 'conversion' }
  ],
  operational: [
    { id: 'queue_length', label: 'Queue Length', unit: 'people', description: 'People currently waiting', category: 'operational' },
    { id: 'avg_wait_time', label: 'Avg Wait Time', unit: 'min', description: 'Queue wait duration', category: 'operational' },
    { id: 'staff_efficiency', label: 'Staff Efficiency', unit: 'ratio', description: 'Customers served per staff', category: 'operational' },
    { id: 'peak_hour', label: 'Peak Hour', unit: 'time', description: 'Busiest time of day', category: 'operational' },
    { id: 'capacity_utilization', label: 'Capacity Utilization', unit: '%', description: 'Avg occupancy / capacity', category: 'operational' }
  ]
};

// ============================================
// INDUSTRY-SPECIFIC KPI PRESETS
// ============================================

export const INDUSTRY_KPIS = {
  restaurant: {
    name: 'Restaurant',
    icon: 'UtensilsCrossed',
    color: '#c4654a',
    kpis: [
      { id: 'table_turnover', label: 'Table Turnover Rate', unit: 'per hr', description: 'Tables served per hour' },
      { id: 'avg_dining_duration', label: 'Avg Dining Duration', unit: 'min', description: 'Time from seat to leave' },
      { id: 'wait_list_length', label: 'Wait List Length', unit: 'parties', description: 'Parties waiting' },
      { id: 'reservation_fulfillment', label: 'Reservation Fulfillment', unit: '%', description: 'Showed vs booked' },
      { id: 'bar_dwell', label: 'Bar Area Dwell', unit: 'min', description: 'Time spent at bar' },
      { id: 'patio_utilization', label: 'Patio Utilization', unit: '%', description: 'Outdoor seating usage' },
      { id: 'peak_meal_period', label: 'Peak Meal Period', unit: 'text', description: 'Lunch vs dinner traffic' },
      { id: 'kitchen_queue_time', label: 'Kitchen Queue Time', unit: 'min', description: 'Order to serve duration' },
      { id: 'server_section_balance', label: 'Server Section Balance', unit: 'ratio', description: 'Even customer distribution' },
      { id: 'host_stand_wait', label: 'Host Stand Wait Time', unit: 'min', description: 'Time to be seated' },
      { id: 'takeout_dinein_split', label: 'Take-Out vs Dine-In', unit: '%', description: 'Order type split' },
      { id: 'happy_hour_lift', label: 'Happy Hour Lift', unit: '%', description: 'Traffic increase 4-7pm' },
      { id: 'dessert_conversion', label: 'Dessert Conversion', unit: '%', description: 'Ordered dessert' },
      { id: 'drink_upsell', label: 'Drink Upsell Rate', unit: '%', description: 'Added beverages' },
      { id: 'party_size_avg', label: 'Party Size Avg', unit: 'people', description: 'People per table' }
    ]
  },

  bar: {
    name: 'Bar / Nightclub',
    icon: 'Wine',
    color: '#8b5cf6',
    kpis: [
      { id: 'cover_charges', label: 'Cover Charges', unit: '$', description: 'Entry fees revenue' },
      { id: 'drinks_per_person', label: 'Avg Drinks Per Person', unit: 'drinks', description: 'Beverage consumption' },
      { id: 'dance_floor_density', label: 'Dance Floor Density', unit: 'per sqft', description: 'People per sq ft' },
      { id: 'vip_utilization', label: 'VIP Table Utilization', unit: '%', description: 'Premium seating usage' },
      { id: 'bottle_service_revenue', label: 'Bottle Service Revenue', unit: '$', description: 'VIP spending' },
      { id: 'peak_crowd_time', label: 'Peak Crowd Time', unit: 'time', description: 'Busiest hour' },
      { id: 'entry_queue_time', label: 'Entry Queue Time', unit: 'min', description: 'Wait to get in' },
      { id: 'id_check_rate', label: 'ID Check Rate', unit: 'per hr', description: 'Verifications per hour' },
      { id: 'reentry_rate', label: 'Re-Entry Rate', unit: '%', description: 'Left and returned' },
      { id: 'crowd_flow_pattern', label: 'Crowd Flow Pattern', unit: 'text', description: 'Movement between areas' },
      { id: 'last_call_exodus', label: 'Last Call Exodus Rate', unit: '%', description: 'Exit speed at closing' },
      { id: 'safety_threshold', label: 'Safety Threshold', unit: '%', description: '% of max capacity' },
      { id: 'drink_order_velocity', label: 'Drink Order Velocity', unit: 'per min', description: 'Orders per minute' },
      { id: 'tab_open_duration', label: 'Tab Open Duration', unit: 'min', description: 'How long tabs stay open' },
      { id: 'tip_rate', label: 'Tip Rate', unit: '%', description: 'Average tip percentage' }
    ]
  },

  retail: {
    name: 'Retail Store',
    icon: 'ShoppingBag',
    color: '#10b981',
    kpis: [
      { id: 'browse_buy_ratio', label: 'Browse-to-Buy Ratio', unit: '%', description: 'Shoppers who purchase' },
      { id: 'fitting_room_conversion', label: 'Fitting Room Conversion', unit: '%', description: 'Tried on -> bought' },
      { id: 'aisle_dwell', label: 'Aisle Dwell Time', unit: 'min', description: 'Time in product areas' },
      { id: 'checkout_abandonment', label: 'Checkout Abandonment', unit: '%', description: 'Left without paying' },
      { id: 'items_per_transaction', label: 'Items Per Transaction', unit: 'items', description: 'Basket size' },
      { id: 'cross_sell_rate', label: 'Cross-Sell Rate', unit: '%', description: 'Bought multiple categories' },
      { id: 'display_engagement', label: 'Display Engagement', unit: 'min', description: 'Time at promotions' },
      { id: 'staff_interaction', label: 'Staff Interaction Rate', unit: '%', description: 'Helped by associate' },
      { id: 'return_rate', label: 'Return Rate', unit: '%', description: 'Items returned' },
      { id: 'loyalty_signup', label: 'Loyalty Sign-Up Rate', unit: '%', description: 'New members' },
      { id: 'promotion_response', label: 'Promotion Response', unit: '%', description: 'Engaged with sales' },
      { id: 'shelf_reach_rate', label: 'Shelf Reach Rate', unit: '%', description: 'Products picked up' },
      { id: 'compare_shopping_time', label: 'Compare Shopping Time', unit: 'min', description: 'Time comparing items' },
      { id: 'impulse_buy_dwell', label: 'Impulse Buy Zone Dwell', unit: 'min', description: 'Time near checkout items' },
      { id: 'cart_usage', label: 'Shopping Cart Usage', unit: '%', description: 'Used basket/cart' }
    ]
  },

  hardware: {
    name: 'Hardware / Home Improvement',
    icon: 'Wrench',
    color: '#f59e0b',
    kpis: [
      { id: 'project_consultation', label: 'Project Consultation Rate', unit: '%', description: 'Asked for help' },
      { id: 'lumber_yard_traffic', label: 'Lumber Yard Traffic', unit: 'people', description: 'Outdoor section visits' },
      { id: 'tool_rental_bookings', label: 'Tool Rental Bookings', unit: 'rentals', description: 'Equipment rentals' },
      { id: 'pro_desk_visits', label: 'Pro Desk Visits', unit: 'people', description: 'Contractor customers' },
      { id: 'diy_pro_split', label: 'DIY vs Pro Split', unit: '%', description: 'Customer type ratio' },
      { id: 'seasonal_dept_traffic', label: 'Seasonal Dept Traffic', unit: 'people', description: 'Garden/Snow section' },
      { id: 'special_order_rate', label: 'Special Order Rate', unit: '%', description: 'Custom orders' },
      { id: 'delivery_scheduling', label: 'Delivery Scheduling', unit: 'orders', description: 'Orders shipped' },
      { id: 'demo_station_engagement', label: 'Demo Station Engagement', unit: 'min', description: 'Product demos watched' },
      { id: 'paint_mixing_wait', label: 'Paint Mixing Wait Time', unit: 'min', description: 'Service queue' },
      { id: 'key_cutting_queue', label: 'Key Cutting Queue', unit: 'min', description: 'Service wait' },
      { id: 'large_item_assistance', label: 'Large Item Assistance', unit: 'requests', description: 'Help requests' },
      { id: 'loading_dock_usage', label: 'Loading Dock Usage', unit: 'people', description: 'Pickup area traffic' },
      { id: 'installation_service', label: 'Installation Service', unit: '%', description: 'Added installation' },
      { id: 'safety_gear_attachment', label: 'Safety Gear Attachment', unit: '%', description: 'Bought PPE with tools' }
    ]
  },

  grocery: {
    name: 'Grocery / Supermarket',
    icon: 'ShoppingCart',
    color: '#06b6d4',
    kpis: [
      { id: 'cart_vs_basket', label: 'Cart vs Basket', unit: '%', description: 'Shopping type' },
      { id: 'fresh_dept_dwell', label: 'Fresh Dept Dwell', unit: 'min', description: 'Time in produce/meat' },
      { id: 'deli_counter_wait', label: 'Deli Counter Wait', unit: 'min', description: 'Service queue time' },
      { id: 'self_checkout_usage', label: 'Self-Checkout Usage', unit: '%', description: 'vs staffed lanes' },
      { id: 'loyalty_scan_rate', label: 'Loyalty Scan Rate', unit: '%', description: 'Cards used' },
      { id: 'coupon_redemption', label: 'Coupon Redemption', unit: '%', description: 'Promos applied' },
      { id: 'aisle_skip_rate', label: 'Aisle Skip Rate', unit: '%', description: 'Sections not visited' },
      { id: 'end_cap_engagement', label: 'End Cap Engagement', unit: 'min', description: 'Promo display views' },
      { id: 'bakery_morning_rush', label: 'Bakery Morning Rush', unit: 'people', description: 'Early traffic' },
      { id: 'evening_dinner_rush', label: 'Evening Dinner Rush', unit: 'people', description: '5-7pm traffic' },
      { id: 'weekend_weekday', label: 'Weekend vs Weekday', unit: 'ratio', description: 'Traffic pattern' },
      { id: 'restock_alert_zones', label: 'Restock Alert Zones', unit: 'zones', description: 'Low inventory areas' },
      { id: 'express_lane_compliance', label: 'Express Lane Compliance', unit: '%', description: 'Item limit followed' },
      { id: 'bag_usage', label: 'Bag Usage', unit: '%', description: 'Plastic vs reusable' },
      { id: 'online_pickup', label: 'Online Pickup Orders', unit: 'orders', description: 'Click & collect' }
    ]
  },

  gym: {
    name: 'Gym / Fitness Center',
    icon: 'Dumbbell',
    color: '#ef4444',
    kpis: [
      { id: 'equipment_utilization', label: 'Equipment Utilization', unit: '%', description: 'Machines in use' },
      { id: 'peak_workout_hours', label: 'Peak Workout Hours', unit: 'time', description: 'Busiest times' },
      { id: 'avg_workout_duration', label: 'Avg Workout Duration', unit: 'min', description: 'Time exercising' },
      { id: 'class_attendance', label: 'Class Attendance Rate', unit: '%', description: 'Booked vs showed' },
      { id: 'locker_room_dwell', label: 'Locker Room Dwell', unit: 'min', description: 'Changing time' },
      { id: 'cardio_weights_split', label: 'Cardio vs Weights Split', unit: '%', description: 'Area preference' },
      { id: 'personal_training', label: 'Personal Training Sessions', unit: 'sessions', description: 'PT bookings' },
      { id: 'membership_checkins', label: 'Membership Check-Ins', unit: 'people', description: 'Daily actives' },
      { id: 'guest_pass_usage', label: 'Guest Pass Usage', unit: 'people', description: 'Trial visitors' },
      { id: 'smoothie_bar_conversion', label: 'Smoothie Bar Conversion', unit: '%', description: 'Bought after workout' },
      { id: 'pool_spa_usage', label: 'Pool/Spa Usage', unit: '%', description: 'Amenity utilization' },
      { id: 'towel_service_usage', label: 'Towel Service Usage', unit: '%', description: 'Amenity tracking' },
      { id: 'peak_class_times', label: 'Peak Class Times', unit: 'time', description: 'Popular schedules' },
      { id: 'equipment_wait_time', label: 'Equipment Wait Time', unit: 'min', description: 'Queue for machines' },
      { id: 'member_retention_signal', label: 'Member Retention Signal', unit: '%', description: 'Declining visits' }
    ]
  },

  hotel: {
    name: 'Hotel / Hospitality',
    icon: 'Building',
    color: '#ec4899',
    kpis: [
      { id: 'lobby_occupancy', label: 'Lobby Occupancy', unit: 'people', description: 'Guests in common areas' },
      { id: 'checkin_queue_time', label: 'Check-In Queue Time', unit: 'min', description: 'Front desk wait' },
      { id: 'concierge_request_rate', label: 'Concierge Request Rate', unit: 'per hr', description: 'Service inquiries/hour' },
      { id: 'pool_spa_traffic', label: 'Pool/Spa Traffic', unit: 'people', description: 'Amenity usage' },
      { id: 'restaurant_capacity', label: 'Restaurant Capacity', unit: '%', description: 'Dining room fill' },
      { id: 'room_service_orders', label: 'Room Service Orders', unit: 'orders', description: 'In-room requests' },
      { id: 'elevator_wait_time', label: 'Elevator Wait Time', unit: 'sec', description: 'Vertical traffic' },
      { id: 'event_space_utilization', label: 'Event Space Utilization', unit: '%', description: 'Meeting room usage' },
      { id: 'bar_revenue_per_guest', label: 'Bar Revenue Per Guest', unit: '$', description: 'F&B spending' },
      { id: 'guest_floor_traffic', label: 'Guest Floor Traffic', unit: 'people', description: 'Hallway activity' },
      { id: 'housekeeping_efficiency', label: 'Housekeeping Efficiency', unit: 'rooms/hr', description: 'Rooms cleaned/hour' },
      { id: 'valet_queue_length', label: 'Valet Queue Length', unit: 'people', description: 'Parking wait' },
      { id: 'checkout_rush_pattern', label: 'Checkout Rush Pattern', unit: 'text', description: 'Morning exit wave' },
      { id: 'late_checkout_rate', label: 'Late Checkout Rate', unit: '%', description: 'Extended stays' },
      { id: 'amenity_cross_usage', label: 'Amenity Cross-Usage', unit: '%', description: 'Multi-service guests' }
    ]
  },

  museum: {
    name: 'Museum / Gallery',
    icon: 'Frame',
    color: '#a855f7',
    kpis: [
      { id: 'exhibit_dwell_time', label: 'Exhibit Dwell Time', unit: 'min', description: 'Time at each display' },
      { id: 'gallery_flow_pattern', label: 'Gallery Flow Pattern', unit: 'text', description: 'Visitor path' },
      { id: 'audio_guide_usage', label: 'Audio Guide Usage', unit: '%', description: 'Tour adoption' },
      { id: 'gift_shop_conversion', label: 'Gift Shop Conversion', unit: '%', description: 'Visited -> purchased' },
      { id: 'cafe_traffic', label: 'Cafe Traffic', unit: 'people', description: 'Food service usage' },
      { id: 'peak_exhibit', label: 'Peak Exhibit', unit: 'text', description: 'Most popular display' },
      { id: 'group_tour_size', label: 'Group Tour Size', unit: 'people', description: 'Guided tour attendance' },
      { id: 'member_public_split', label: 'Member vs Public', unit: '%', description: 'Ticket type split' },
      { id: 'photography_hotspots', label: 'Photography Hotspots', unit: 'text', description: 'Photo-taking areas' },
      { id: 'bench_utilization', label: 'Bench Utilization', unit: '%', description: 'Rest area usage' },
      { id: 'interactive_station_time', label: 'Interactive Station Time', unit: 'min', description: 'Hands-on exhibits' },
      { id: 'docent_engagement', label: 'Docent Engagement Rate', unit: '%', description: 'Staff interactions' },
      { id: 'return_visit_rate', label: 'Return Visit Rate', unit: '%', description: 'Repeat visitors' },
      { id: 'special_exhibit_lift', label: 'Special Exhibit Lift', unit: '%', description: 'Temporary show impact' },
      { id: 'accessibility_route', label: 'Accessibility Route', unit: '%', description: 'Elevator/ramp usage' }
    ]
  },

  airport: {
    name: 'Airport / Transit Hub',
    icon: 'Plane',
    color: '#3b82f6',
    kpis: [
      { id: 'security_queue_time', label: 'Security Queue Time', unit: 'min', description: 'TSA wait estimate' },
      { id: 'gate_area_density', label: 'Gate Area Density', unit: 'people', description: 'Terminal crowding' },
      { id: 'retail_dwell_time', label: 'Retail Dwell Time', unit: 'min', description: 'Shopping duration' },
      { id: 'food_court_capacity', label: 'Food Court Capacity', unit: '%', description: 'Dining area fill' },
      { id: 'lounge_utilization', label: 'Lounge Utilization', unit: '%', description: 'Premium area usage' },
      { id: 'boarding_gate_flow', label: 'Boarding Gate Flow', unit: 'per min', description: 'Passenger throughput' },
      { id: 'baggage_claim_wait', label: 'Baggage Claim Wait', unit: 'min', description: 'Carousel dwell' },
      { id: 'ground_transport_queue', label: 'Ground Transport Queue', unit: 'min', description: 'Taxi/rideshare line' },
      { id: 'flight_display_dwell', label: 'Flight Display Dwell', unit: 'sec', description: 'Info screen attention' },
      { id: 'restroom_queue_length', label: 'Restroom Queue Length', unit: 'people', description: 'Facility wait' },
      { id: 'charging_station_usage', label: 'Charging Station Usage', unit: '%', description: 'Power outlet demand' },
      { id: 'gate_change_impact', label: 'Gate Change Impact', unit: 'people', description: 'Passenger redirection' },
      { id: 'concourse_flow_rate', label: 'Concourse Flow Rate', unit: 'per min', description: 'Hallway throughput' },
      { id: 'early_arrival_rate', label: 'Early Arrival Rate', unit: '%', description: '>2hr before flight' },
      { id: 'connection_rush', label: 'Connection Rush', unit: '%', description: 'Tight transfer times' }
    ]
  },

  casino: {
    name: 'Casino / Entertainment',
    icon: 'Dice5',
    color: '#eab308',
    kpis: [
      { id: 'gaming_floor_density', label: 'Gaming Floor Density', unit: 'per sqft', description: 'Players per area' },
      { id: 'slot_machine_turnover', label: 'Slot Machine Turnover', unit: '%', description: 'Machine usage rate' },
      { id: 'table_game_occupancy', label: 'Table Game Occupancy', unit: '%', description: 'Seats filled' },
      { id: 'high_roller_traffic', label: 'High Roller Room Traffic', unit: 'people', description: 'VIP area usage' },
      { id: 'buffet_queue_length', label: 'Buffet Queue Length', unit: 'min', description: 'Restaurant wait' },
      { id: 'show_attendance', label: 'Show Attendance', unit: '%', description: 'Event fill rate' },
      { id: 'comp_redemption_rate', label: 'Comp Redemption Rate', unit: '%', description: 'Free play usage' },
      { id: 'cash_cage_wait', label: 'Cash Cage Wait Time', unit: 'min', description: 'Transaction queue' },
      { id: 'parking_garage_fill', label: 'Parking Garage Fill', unit: '%', description: 'Capacity tracking' },
      { id: 'hotel_casino_flow', label: 'Hotel-Casino Flow', unit: 'people', description: 'Guest movement' },
      { id: 'bar_dwell_time', label: 'Bar Dwell Time', unit: 'min', description: 'Lounge duration' },
      { id: 'atm_usage_rate', label: 'ATM Usage Rate', unit: 'per hr', description: 'Cash withdrawal freq' },
      { id: 'loyalty_card_scans', label: 'Loyalty Card Scans', unit: 'scans', description: 'Player tracking' },
      { id: 'peak_gaming_hours', label: 'Peak Gaming Hours', unit: 'time', description: 'Busiest periods' },
      { id: 'floor_walker_coverage', label: 'Floor Walker Coverage', unit: '%', description: 'Staff distribution' }
    ]
  },

  medical: {
    name: 'Medical / Healthcare',
    icon: 'Stethoscope',
    color: '#14b8a6',
    kpis: [
      { id: 'waiting_room_occupancy', label: 'Waiting Room Occupancy', unit: 'people', description: 'Patient queue' },
      { id: 'avg_wait_time', label: 'Avg Wait Time', unit: 'min', description: 'Check-in to call' },
      { id: 'exam_room_turnover', label: 'Exam Room Turnover', unit: 'per hr', description: 'Room utilization' },
      { id: 'lab_queue_length', label: 'Lab Queue Length', unit: 'people', description: 'Blood draw wait' },
      { id: 'pharmacy_wait_time', label: 'Pharmacy Wait Time', unit: 'min', description: 'Prescription pickup' },
      { id: 'checkin_efficiency', label: 'Check-In Efficiency', unit: 'min', description: 'Registration speed' },
      { id: 'no_show_rate', label: 'No-Show Rate', unit: '%', description: 'Missed appointments' },
      { id: 'walkin_scheduled', label: 'Walk-In vs Scheduled', unit: '%', description: 'Appointment type split' },
      { id: 'emergency_overflow', label: 'Emergency Overflow', unit: '%', description: 'ED to other areas' },
      { id: 'staff_station_density', label: 'Staff Station Density', unit: 'people', description: 'Nurse station traffic' },
      { id: 'wheelchair_assist', label: 'Wheelchair Assist Calls', unit: 'calls', description: 'Mobility requests' },
      { id: 'visitor_patient_ratio', label: 'Visitor-to-Patient Ratio', unit: 'ratio', description: 'Family presence' },
      { id: 'discharge_processing', label: 'Discharge Processing', unit: 'min', description: 'Exit time' },
      { id: 'specialty_dept_traffic', label: 'Specialty Dept Traffic', unit: 'people', description: 'Department popularity' },
      { id: 'parking_accessibility', label: 'Parking Accessibility', unit: '%', description: 'Handicap spot usage' }
    ]
  },

  generic: {
    name: 'Generic / Other',
    icon: 'Building2',
    color: '#64748b',
    kpis: [
      { id: 'visitor_flow', label: 'Visitor Flow Rate', unit: 'per min', description: 'Traffic throughput' },
      { id: 'peak_traffic_time', label: 'Peak Traffic Time', unit: 'time', description: 'Busiest period' },
      { id: 'area_utilization', label: 'Area Utilization', unit: '%', description: 'Space usage' },
      { id: 'service_wait_time', label: 'Service Wait Time', unit: 'min', description: 'Queue duration' },
      { id: 'staff_customer_ratio', label: 'Staff/Customer Ratio', unit: 'ratio', description: 'Coverage level' },
      { id: 'repeat_visitor_rate', label: 'Repeat Visitor Rate', unit: '%', description: 'Return frequency' },
      { id: 'satisfaction_signal', label: 'Satisfaction Signal', unit: '%', description: 'Engagement proxy' },
      { id: 'facility_turnover', label: 'Facility Turnover', unit: 'per hr', description: 'Usage cycles' },
      { id: 'congestion_points', label: 'Congestion Points', unit: 'zones', description: 'Bottleneck areas' },
      { id: 'off_peak_utilization', label: 'Off-Peak Utilization', unit: '%', description: 'Quiet time usage' },
      { id: 'weather_impact', label: 'Weather Impact', unit: '%', description: 'Traffic variance' },
      { id: 'event_lift', label: 'Event Lift', unit: '%', description: 'Special occasion impact' },
      { id: 'morning_afternoon_split', label: 'Morning/Afternoon Split', unit: '%', description: 'Time preference' },
      { id: 'accessibility_usage', label: 'Accessibility Usage', unit: '%', description: 'ADA compliance' },
      { id: 'complaint_correlation', label: 'Complaint Correlation', unit: 'ratio', description: 'Issue detection' }
    ]
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all KPIs for a specific industry (core + industry-specific)
 */
export function getIndustryKPIs(industryId) {
  const coreKPIs = [
    ...CORE_KPIS.trafficFlow,
    ...CORE_KPIS.dwellEngagement,
    ...CORE_KPIS.conversionRevenue,
    ...CORE_KPIS.operational
  ];

  const industryKPIs = INDUSTRY_KPIS[industryId]?.kpis || [];

  return {
    core: coreKPIs,
    industry: industryKPIs,
    all: [...coreKPIs, ...industryKPIs],
    metadata: INDUSTRY_KPIS[industryId] || INDUSTRY_KPIS.generic
  };
}

/**
 * Get list of all available industries
 */
export function getIndustryList() {
  return Object.entries(INDUSTRY_KPIS).map(([id, data]) => ({
    id,
    name: data.name,
    icon: data.icon,
    color: data.color,
    kpiCount: data.kpis.length
  }));
}

/**
 * Generate random KPI value based on type
 */
export function generateKPIValue(kpi) {
  const random = (min, max) => Math.round(Math.random() * (max - min) + min);
  const randomFloat = (min, max) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

  switch (kpi.unit) {
    case '%':
      return randomFloat(15, 95);
    case 'people':
      return random(10, 500);
    case 'min':
      return randomFloat(2, 45);
    case 'sec':
      return random(10, 180);
    case '$':
      return randomFloat(5, 150);
    case 'per hr':
    case 'per min':
      return randomFloat(1, 50);
    case 'ratio':
      return randomFloat(0.5, 3.5);
    case 'time':
      return `${random(8, 20)}:00`;
    case 'text':
      return 'Active';
    default:
      return random(1, 100);
  }
}

/**
 * Generate all KPI values for an industry
 */
export function generateAllIndustryKPIValues(industryId) {
  const { all, metadata } = getIndustryKPIs(industryId);

  return all.map(kpi => ({
    ...kpi,
    value: generateKPIValue(kpi),
    trend: Math.round((Math.random() - 0.5) * 40) / 10, // -20% to +20%
    trendDirection: Math.random() > 0.5 ? 'up' : 'down',
    color: metadata.color
  }));
}

export default {
  CORE_KPIS,
  INDUSTRY_KPIS,
  getIndustryKPIs,
  getIndustryList,
  generateKPIValue,
  generateAllIndustryKPIValues
};
