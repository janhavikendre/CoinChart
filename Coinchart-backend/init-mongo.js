db = db.getSiblingDB(process.env.MONGO_DATABASE || "admin");

db.createUser({
  user: process.env.MONGO_ROOT_USER || "mongodb",
  pwd: process.env.MONGO_ROOT_PASSWORD || "mysecurepassword",
  roles: [
    { role: "readWrite", db: process.env.MONGO_DATABASE || "Bubbles" },
    { role: "dbAdmin", db: process.env.MONGO_DATABASE || "Bubbles" }
  ]
});

print("✅ MongoDB User Created Successfully!");