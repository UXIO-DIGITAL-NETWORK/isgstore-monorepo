#!/usr/bin/env python3
"""Generate Postman collection JSON for all Uxio API endpoints."""
import json

def auth():
    return {"type":"bearer","bearer":[{"key":"token","value":"{{access_token}}","type":"string"}]}

def hdr():
    return [{"key":"Accept","value":"application/json"}]

def url(path_str):
    parts = path_str.strip("/").split("/")
    return {"raw":"{{base_url}}/"+path_str,"host":["{{base_url}}"],"path":parts}

def body(raw_dict):
    return {"mode":"raw","raw":json.dumps(raw_dict,indent=4),"options":{"raw":{"language":"json"}}}

def get(name, path):
    return {"name":name,"request":{"auth":auth(),"method":"GET","header":hdr(),"url":url(path)}}

def post(name, path, raw_dict):
    return {"name":name,"request":{"auth":auth(),"method":"POST","header":hdr(),"body":body(raw_dict),"url":url(path)}}

def put(name, path, raw_dict):
    return {"name":name,"request":{"auth":auth(),"method":"PUT","header":hdr(),"body":body(raw_dict),"url":url(path)}}

def delete(name, path):
    return {"name":name,"request":{"auth":auth(),"method":"DELETE","header":hdr(),"url":url(path)}}

def patch(name, path, raw_dict):
    return {"name":name,"request":{"auth":auth(),"method":"PATCH","header":hdr(),"body":body(raw_dict),"url":url(path)}}

# ---- Build Collection ----
collection = {
    "info": {
        "_postman_id": "uxio-topup-platform-api-v1",
        "name": "Uxio Top-up Platform API",
        "description": "Complete Postman collection for the ISG Store headless API. Covers Auth, Users, Master Data (Categories, Suppliers, Products), Transactions (Orders, Payments), CMS (Banners, Announcements), Leaderboard, and Activity Logs.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        {"key":"base_url","value":"http://localhost:8000/api","type":"string"}
    ],
    "item": []
}

# --- System ---
collection["item"].append({
    "name": "System",
    "item": [
        {"name":"Ping","request":{"method":"GET","header":hdr(),"url":url("ping")}},
        {"name":"Health Check","request":{"method":"GET","header":hdr(),"url":url("health")}}
    ]
})

# --- Auth ---
login_req = {
    "name":"Login",
    "event":[{"listen":"test","script":{"exec":["var jsonData = pm.response.json();","if (jsonData.status === 'success') {","    pm.environment.set('access_token', jsonData.data.access_token);","    pm.environment.set('refresh_token', jsonData.data.refresh_token);","}"],"type":"text/javascript"}}],
    "request":{
        "method":"POST","header":hdr(),
        "body":body({"email":"admin@isgstore.id","password":"isgStore#@$8"}),  # UserSeeder's admin
        "url":url("v1/auth/login")
    }
}
refresh_req = {
    "name":"Refresh Token",
    "event":[{"listen":"test","script":{"exec":["var jsonData = pm.response.json();","if (jsonData.status === 'success') {","    pm.environment.set('access_token', jsonData.data.access_token);","}"],"type":"text/javascript"}}],
    "request":{
        "method":"POST","header":hdr(),
        "body":body({"refresh_token":"{{refresh_token}}"}),
        "url":url("v1/auth/refresh")
    }
}
logout_req = {"name":"Logout","request":{"auth":auth(),"method":"POST","header":hdr(),"url":url("v1/auth/logout")}}
collection["item"].append({"name":"Auth","item":[login_req, refresh_req, logout_req]})

# --- Users ---
collection["item"].append({"name":"Users","item":[
    get("Get Profile (Me)", "v1/user"),
    get("Get All Users", "v1/users"),
    post("Create User", "v1/users", {"role_id":2,"name":"John Doe","email":"johndoe@example.com","phone":"081234567890","password":"secret123"}),
    get("Get User Detail", "v1/users/1"),
    put("Update User", "v1/users/1", {"name":"John Doe Updated","phone":"081299998888"}),
    delete("Delete User", "v1/users/1"),
    patch("Sync Timezone", "v1/users/sync-timezone", {"timezone":"Asia/Jakarta"})
]})

# --- Category Types ---
collection["item"].append({"name":"Category Types","item":[
    get("Get All Category Types", "v1/category-types"),
    post("Create Category Type", "v1/category-types", {"name":"Game","code":"game"}),
    get("Get Category Type Detail", "v1/category-types/1"),
    put("Update Category Type", "v1/category-types/1", {"name":"Game Updated","code":"game"}),
    delete("Delete Category Type", "v1/category-types/1")
]})

# --- Categories ---
collection["item"].append({"name":"Categories","item":[
    get("Get All Categories", "v1/categories"),
    post("Create Category", "v1/categories", {"category_type_id":1,"name":"Mobile Legends","code":"mlbb","icon_path":"/icons/mlbb.png","banner_path":"/banners/mlbb.jpg","status":True}),
    get("Get Category Detail", "v1/categories/1"),
    put("Update Category", "v1/categories/1", {"category_type_id":1,"name":"Mobile Legends: Bang Bang","code":"mlbb","icon_path":"/icons/mlbb.png","banner_path":"/banners/mlbb.jpg","status":True}),
    delete("Delete Category", "v1/categories/1")
]})

# --- Sub Categories ---
collection["item"].append({"name":"Sub Categories","item":[
    get("Get All Sub Categories", "v1/sub-categories"),
    post("Create Sub Category", "v1/sub-categories", {"category_id":1,"name":"Diamond","code":"diamond"}),
    get("Get Sub Category Detail", "v1/sub-categories/1"),
    put("Update Sub Category", "v1/sub-categories/1", {"category_id":1,"name":"Weekly Diamond Pass","code":"weekly-pass"}),
    delete("Delete Sub Category", "v1/sub-categories/1")
]})

# --- Server Categories ---
collection["item"].append({"name":"Server Categories","item":[
    get("Get All Server Categories", "v1/server-categories"),
    post("Create Server Category", "v1/server-categories", {"category_id":1,"name":"User ID","input_type":"text","placeholder":"Masukkan User ID"}),
    get("Get Server Category Detail", "v1/server-categories/1"),
    put("Update Server Category", "v1/server-categories/1", {"category_id":1,"name":"User ID","input_type":"text","placeholder":"Masukkan User ID Anda"}),
    delete("Delete Server Category", "v1/server-categories/1")
]})

# --- Server Category Options ---
collection["item"].append({"name":"Server Category Options","item":[
    get("Get All Server Category Options", "v1/server-category-options"),
    post("Create Server Category Option", "v1/server-category-options", {"server_category_id":1,"label":"Server Asia","value":"asia"}),
    get("Get Server Category Option Detail", "v1/server-category-options/1"),
    put("Update Server Category Option", "v1/server-category-options/1", {"server_category_id":1,"label":"Server Southeast Asia","value":"sea"}),
    delete("Delete Server Category Option", "v1/server-category-options/1")
]})

# --- Suppliers ---
collection["item"].append({"name":"Suppliers","item":[
    get("Get All Suppliers", "v1/suppliers"),
    post("Create Supplier", "v1/suppliers", {"name":"Uxiolabs","status":True}),
    get("Get Supplier Detail", "v1/suppliers/1"),
    put("Update Supplier", "v1/suppliers/1", {"name":"Uxiolabs V2","status":True}),
    delete("Delete Supplier", "v1/suppliers/1")
]})

# --- Supplier Categories ---
collection["item"].append({"name":"Supplier Categories","item":[
    get("Get All Supplier Categories", "v1/supplier-categories"),
    post("Create Supplier Category", "v1/supplier-categories", {"category_id":1,"supplier_id":1,"template_code":"game"}),
    get("Get Supplier Category Detail", "v1/supplier-categories/1"),
    put("Update Supplier Category", "v1/supplier-categories/1", {"category_id":1,"supplier_id":1,"template_code":"game-v2"}),
    delete("Delete Supplier Category", "v1/supplier-categories/1")
]})

# --- Products ---
collection["item"].append({"name":"Products","item":[
    get("Get All Products", "v1/products"),
    post("Create Product", "v1/products", {"category_id":1,"sub_category_id":1,"name":"86 Diamond","code":"MLBB-86D","price_modal":12000,"price_member":13500,"price_vip":13000,"price_reseller":12500,"price_agent":12200,"status":True}),
    get("Get Product Detail", "v1/products/1"),
    put("Update Product", "v1/products/1", {"category_id":1,"sub_category_id":1,"name":"86 Diamond MLBB","code":"MLBB-86D","price_modal":12500,"price_member":14000,"price_vip":13500,"price_reseller":13000,"price_agent":12700,"status":True}),
    delete("Delete Product", "v1/products/1")
]})

# --- Supplier Products ---
collection["item"].append({"name":"Supplier Products","item":[
    get("Get All Supplier Products", "v1/supplier-products"),
    post("Create Supplier Product", "v1/supplier-products", {"product_id":1,"supplier_id":1,"buyer_sku_code":"mlbb86","price":12000,"is_active":True,"status":True}),
    get("Get Supplier Product Detail", "v1/supplier-products/1"),
    put("Update Supplier Product", "v1/supplier-products/1", {"product_id":1,"supplier_id":1,"buyer_sku_code":"mlbb86-v2","price":12500,"is_active":True,"status":True}),
    delete("Delete Supplier Product", "v1/supplier-products/1")
]})

# --- Orders ---
collection["item"].append({"name":"Orders","item":[
    get("Get All Orders", "v1/orders"),
    post("Create Order", "v1/orders", {"user_id":1,"product_id":1,"supplier_id":1,"target_uid":"123456789","target_server":"12345","total_price":14000,"margin":2000,"status":"Pending","is_manual":False,"sn":None,"supplier_trx_id":None,"supplier_status":None}),
    get("Get Order Detail", "v1/orders/1"),
    put("Update Order", "v1/orders/1", {"user_id":1,"product_id":1,"supplier_id":1,"target_uid":"123456789","target_server":"12345","total_price":14000,"margin":2000,"status":"Processing","is_manual":False,"sn":"VOUCHER123","supplier_trx_id":"DGF-001","supplier_status":"Sukses"}),
    delete("Delete Order", "v1/orders/1")
]})

# --- Payments ---
collection["item"].append({"name":"Payments","item":[
    get("Get All Payments", "v1/payments"),
    post("Create Payment", "v1/payments", {"order_id":1,"payment_method_id":1,"pg_transaction_id":None,"gross_amount":15000,"admin_fee":1000,"payment_data":{"virtual_account":"8801234567890"},"status":"pending","paid_at":None}),
    get("Get Payment Detail", "v1/payments/1"),
    put("Update Payment", "v1/payments/1", {"order_id":1,"payment_method_id":1,"pg_transaction_id":"MNTP-TRX-001","gross_amount":15000,"admin_fee":1000,"payment_data":{"virtual_account":"8801234567890"},"status":"success","paid_at":"2026-04-28 22:00:00"}),
    delete("Delete Payment", "v1/payments/1")
]})

# --- Monetapay Callback (public, no auth) ---
monetapay_cb = {
    "name":"Monetapay Callback",
    "request":{
        "method":"POST","header":hdr(),
        "body":body({"reference_id":"PAY-INV-20260428-ABC123-01","amount":15000,"status":"SUCCESS","signature":"abc123hash"}),
        "url":url("v1/payments/monetapay/callback")
    }
}
collection["item"].append({"name":"Payment Webhooks","description":"Public endpoints — no auth required.","item":[monetapay_cb]})

# --- Point Histories ---
collection["item"].append({"name":"Point Histories","item":[
    get("Get All Point Histories", "v1/point-histories"),
    post("Create Point History", "v1/point-histories", {"user_id":1,"order_id":1,"points_before":0,"points_added":10,"points_after":10,"description":"Points earned from order #1"}),
    get("Get Point History Detail", "v1/point-histories/1"),
    put("Update Point History", "v1/point-histories/1", {"user_id":1,"order_id":1,"points_before":0,"points_added":15,"points_after":15,"description":"Points adjusted for order #1"}),
    delete("Delete Point History", "v1/point-histories/1")
]})

# --- Ratings ---
collection["item"].append({"name":"Ratings","item":[
    get("Get All Ratings", "v1/ratings"),
    post("Create Rating", "v1/ratings", {"order_id":1,"user_id":1,"rating":5}),
    get("Get Rating Detail", "v1/ratings/1"),
    put("Update Rating", "v1/ratings/1", {"order_id":1,"user_id":1,"rating":4}),
    delete("Delete Rating", "v1/ratings/1")
]})

# --- Banners ---
collection["item"].append({"name":"CMS: Banners","item":[
    get("Get All Banners", "v1/banners"),
    post("Create Banner", "v1/banners", {"category_id":None,"name":"Promo Ramadan","image_path":"https://cdn.example.com/banners/ramadan.jpg","link":"https://example.com/promo"}),
    get("Get Banner Detail", "v1/banners/1"),
    put("Update Banner", "v1/banners/1", {"category_id":1,"name":"Promo MLBB Special","image_path":"https://cdn.example.com/banners/mlbb.jpg","link":"https://example.com/mlbb-promo"}),
    delete("Delete Banner", "v1/banners/1")
]})

# --- Announcements ---
collection["item"].append({"name":"CMS: Announcements","item":[
    get("Get All Announcements", "v1/announcements"),
    post("Create Announcement", "v1/announcements", {"category_id":None,"content":"Server maintenance scheduled for Sunday 00:00 - 02:00 WIB.","image_path":None,"is_active":True}),
    get("Get Announcement Detail", "v1/announcements/1"),
    put("Update Announcement", "v1/announcements/1", {"category_id":1,"content":"Flash sale MLBB diamonds 50% off!","image_path":"https://cdn.example.com/announce/flash.jpg","is_active":True}),
    delete("Delete Announcement", "v1/announcements/1")
]})

# --- Activity Logs ---
collection["item"].append({"name":"Activity Logs","item":[
    get("Get All Activity Logs", "v1/activity-logs")
]})

# --- Leaderboard ---
collection["item"].append({"name":"Leaderboard","item":[
    get("Get Leaderboard", "v1/leaderboard")
]})

print(json.dumps(collection, indent=2))
