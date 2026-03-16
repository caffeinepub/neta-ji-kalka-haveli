import List "mo:core/List";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Types
  type MenuItem = {
    id : Nat;
    name : Text;
    description : Text;
    price : Text;
    category : Text;
    isAvailable : Bool;
  };

  module MenuItem {
    public func compare(item1 : MenuItem, item2 : MenuItem) : Order.Order {
      Nat.compare(item1.id, item2.id);
    };
  };

  type ContactMessage = {
    name : Text;
    phone : Text;
    message : Text;
    timestamp : Time.Time;
  };

  module ContactMessage {
    public func compare(msg1 : ContactMessage, msg2 : ContactMessage) : Order.Order {
      Int.compare(msg2.timestamp, msg1.timestamp);
    };
  };

  type GalleryImage = {
    url : Text;
    caption : Text;
  };

  module GalleryImage {
    public func compare(img1 : GalleryImage, img2 : GalleryImage) : Order.Order {
      Text.compare(img1.caption, img2.caption);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  // State
  let menuItems = Map.empty<Nat, MenuItem>();
  let contactMessages = List.empty<ContactMessage>();
  let galleryImages = List.empty<GalleryImage>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextMenuItemId = 1;
  var isInitialized = false;

  // Authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Initial seed data
  public shared ({ caller }) func initialize() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can initialize the system");
    };

    if (isInitialized) {
      Runtime.trap("System already initialized");
    };

    let initialItems : [MenuItem] = [
      {
        id = nextMenuItemId;
        name = "Paneer Butter Masala";
        description = "Creamy cottage cheese curry with rich tomato gravy";
        price = "₹220";
        category = "Veg";
        isAvailable = true;
      },
      {
        id = nextMenuItemId + 1;
        name = "Chicken Biryani";
        description = "Flavourful rice dish with tender chicken pieces";
        price = "₹300";
        category = "Non-Veg";
        isAvailable = true;
      },
      {
        id = nextMenuItemId + 2;
        name = "Masala Dosa";
        description = "Crispy rice crepe with spicy potato filling";
        price = "₹120";
        category = "Veg";
        isAvailable = true;
      },
      {
        id = nextMenuItemId + 3;
        name = "Butter Chicken";
        description = "Juicy chicken in creamy tomato sauce";
        price = "₹280";
        category = "Non-Veg";
        isAvailable = true;
      },
      {
        id = nextMenuItemId + 4;
        name = "Mango Lassi";
        description = "Sweet mango flavored yogurt drink";
        price = "₹70";
        category = "Drinks";
        isAvailable = true;
      },
      {
        id = nextMenuItemId + 5;
        name = "Tandoori Roti";
        description = "Whole wheat flatbread cooked in tandoor";
        price = "₹25";
        category = "Breads";
        isAvailable = true;
      },
      {
        id = nextMenuItemId + 6;
        name = "Mutton Korma";
        description = "Slow-cooked mutton in rich spices";
        price = "₹320";
        category = "Non-Veg";
        isAvailable = true;
      },
      {
        id = nextMenuItemId + 7;
        name = "Masala Chai";
        description = "Spiced Indian milk tea";
        price = "₹40";
        category = "Drinks";
        isAvailable = true;
      },
      {
        id = nextMenuItemId + 8;
        name = "Palak Paneer";
        description = "Cottage cheese cubes in spinach gravy";
        price = "₹200";
        category = "Veg";
        isAvailable = true;
      },
      {
        id = nextMenuItemId + 9;
        name = "Naan";
        description = "Soft and fluffy Indian bread";
        price = "₹35";
        category = "Breads";
        isAvailable = true;
      },
    ];

    for (item in initialItems.values()) {
      menuItems.add(item.id, item);
    };
    nextMenuItemId += initialItems.size();
    isInitialized := true;
  };

  // Menu Item Management
  public query ({ caller }) func getAllAvailableMenuItems() : async [MenuItem] {
    let availableItems = menuItems.values().toArray().filter(func(item) { item.isAvailable });
    availableItems.sort();
  };

  public shared ({ caller }) func createMenuItem(name : Text, description : Text, price : Text, category : Text) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create menu items");
    };

    let id = nextMenuItemId;
    let newItem : MenuItem = {
      id;
      name;
      description;
      price;
      category;
      isAvailable = true;
    };

    menuItems.add(id, newItem);
    nextMenuItemId += 1;
    id;
  };

  public shared ({ caller }) func updateMenuItem(id : Nat, name : Text, description : Text, price : Text, category : Text, isAvailable : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update menu items");
    };

    switch (menuItems.get(id)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?_existing) {
        let updatedItem : MenuItem = {
          id;
          name;
          description;
          price;
          category;
          isAvailable;
        };
        menuItems.add(id, updatedItem);
      };
    };
  };

  public shared ({ caller }) func deleteMenuItem(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete menu items");
    };

    if (not menuItems.containsKey(id)) {
      Runtime.trap("Menu item not found");
    };
    menuItems.remove(id);
  };

  // Contact Messages
  public shared ({ caller }) func submitContactMessage(name : Text, phone : Text, message : Text) : async () {
    let newMessage : ContactMessage = {
      name;
      phone;
      message;
      timestamp = Time.now();
    };

    contactMessages.add(newMessage);
  };

  public query ({ caller }) func getAllContactMessages() : async [ContactMessage] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view contact messages");
    };

    contactMessages.toArray().sort();
  };

  // Gallery Management
  public shared ({ caller }) func addGalleryImage(url : Text, caption : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add gallery images");
    };

    let newImage : GalleryImage = { url; caption };
    galleryImages.add(newImage);
  };

  public shared ({ caller }) func deleteGalleryImage(url : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete gallery images");
    };

    let filteredImages = galleryImages.filter(
      func(img) { img.url != url }
    );
    galleryImages.clear();
    galleryImages.addAll(filteredImages.values());
  };

  public query ({ caller }) func getAllGalleryImages() : async [GalleryImage] {
    galleryImages.toArray().sort();
  };

  // Stats
  public query ({ caller }) func getStats() : async (Nat, Nat, Nat) {
    let menuItemCount = menuItems.size();
    let messageCount = contactMessages.size();
    let galleryImageCount = galleryImages.size();
    (menuItemCount, messageCount, galleryImageCount);
  };

  // Filter Menu Items by Category
  public query ({ caller }) func getMenuItemsByCategory(category : Text) : async [MenuItem] {
    let filteredItems = menuItems.values().toArray().filter(
      func(item) { item.category == category and item.isAvailable }
    );
    filteredItems.sort();
  };

  // Toggle Menu Item Availability
  public shared ({ caller }) func toggleMenuItemAvailability(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can toggle menu item availability");
    };

    switch (menuItems.get(id)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?item) {
        let updatedItem : MenuItem = {
          id = item.id;
          name = item.name;
          description = item.description;
          price = item.price;
          category = item.category;
          isAvailable = not item.isAvailable;
        };
        menuItems.add(id, updatedItem);
      };
    };
  };
};
