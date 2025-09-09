#!/usr/bin/env python3
"""
Simple Image Verification Script
Checks if images are actually loading on the website
"""

import requests
from urllib.parse import urljoin
import sys

def check_image_exists(base_url, image_path):
    """Check if an image exists and loads correctly"""
    try:
        image_url = urljoin(base_url, image_path)
        response = requests.head(image_url, timeout=10)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'image' in content_type:
                print(f"[SUCCESS] {image_path} - EXISTS and loads correctly ({content_type})")
                return True
            else:
                print(f"[ERROR] {image_path} - EXISTS but wrong content type: {content_type}")
                return False
        else:
            print(f"[ERROR] {image_path} - HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"[ERROR] {image_path} - ERROR: {e}")
        return False

def verify_blog_images(website_url):
    """Verify all blog images are loading"""
    print(f"Checking blog images on: {website_url}")
    print("=" * 60)
    
    # The blog images we deployed
    blog_images = [
        "1a.jpg",  # AI in SaaS article
        "2a.jpg",  # Data Analytics Trends
        "3a.jpg",  # Building Scalable Analytics
    ]
    
    success_count = 0
    total_count = len(blog_images)
    
    for image in blog_images:
        if check_image_exists(website_url, image):
            success_count += 1
    
    print("=" * 60)
    print(f"RESULTS: {success_count}/{total_count} images loading correctly")
    
    if success_count == total_count:
        print("SUCCESS: All blog images are loading correctly!")
        return True
    else:
        print("FAILURE: Some blog images are not loading correctly!")
        return False

if __name__ == "__main__":
    website_url = "https://moonlight-clean-deploy-3ob1wo6bl-alimabsoute-3065s-projects.vercel.app/"
    
    success = verify_blog_images(website_url)
    sys.exit(0 if success else 1)