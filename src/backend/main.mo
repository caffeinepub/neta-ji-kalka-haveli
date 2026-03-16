import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

actor {

  // ── Types ──────────────────────────────────────────────────────────

  public type AdminRole = { #mainAdmin; #admin; #staff };

  // NOTE: Keep this type identical to the previous version for upgrade compatibility.
  // mustChangePassword is tracked separately in mustChangePwd map.
  public type AdminAccount = {
    id : Nat;
    email : Text;
    passwordHash : Text;
    role : AdminRole;
  };

  // NOTE: Keep this type identical to the previous version for upgrade compatibility.
  public type AdminSession = {
    adminId : Nat;
    email : Text;
    role : AdminRole;
    expiresAt : Int;
  };

  public type AccountInfo = {
    id : Nat;
    email : Text;
    role : AdminRole;
  };

  public type SessionInfo = {
    email : Text;
    role : AdminRole;
    mustChangePassword : Bool;
  };

  public type RestaurantInfo = {
    phone : Text;
    email : Text;
    address : Text;
  };

  public type MenuItem = {
    id : Nat;
    name : Text;
    description : Text;
    price : Text;
    category : Text;
    isAvailable : Bool;
  };

  module MenuItem {
    public func compare(a : MenuItem, b : MenuItem) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  public type GalleryImage = {
    url : Text;
    caption : Text;
  };

  module GalleryImage {
    public func compare(a : GalleryImage, b : GalleryImage) : Order.Order {
      Text.compare(a.caption, b.caption);
    };
  };

  public type ContactMessage = {
    name : Text;
    phone : Text;
    message : Text;
    timestamp : Time.Time;
  };

  module ContactMessage {
    public func compare(a : ContactMessage, b : ContactMessage) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  // ── Legacy Stable Variables (kept for upgrade compatibility) ──────

  type LegacyUserProfile = { name : Text };
  type LegacySecondaryAdmin = { id : Nat; email : Text; passwordHash : Text };
  type LegacySecondaryAdminSession = { adminEmail : Text; expiresAt : Int };

  let userProfiles = Map.empty<Principal, LegacyUserProfile>();
  var mainAdmin : ?Principal = null;
  var secondaryAdminCounter = 0;
  var sessionTokenCounter = 0;
  var isInitialized = false;
  let secondaryAdmins = Map.empty<Text, LegacySecondaryAdmin>();
  let secondarySessions = Map.empty<Text, LegacySecondaryAdminSession>();
  let accessControlState = AccessControl.initState();

  // Keep isSetup from old version to avoid M0169 discard error
  var isSetup = false;

  // ── State ──────────────────────────────────────────────────────────

  var isSeeded = false;
  var adminCounter = 0;
  var sessionCounter = 0;
  var nextMenuItemId = 1;
  var isMenuInitialized = false;

  let admins = Map.empty<Text, AdminAccount>();
  let sessions = Map.empty<Text, AdminSession>();
  // Separate map for mustChangePassword flag (avoids type incompatibility on upgrade)
  let mustChangePwd = Map.empty<Text, Bool>();

  let menuItems = Map.empty<Nat, MenuItem>();
  var galleryImages = List.empty<GalleryImage>();
  let contactMessages = List.empty<ContactMessage>();

  var restaurantInfo : RestaurantInfo = {
    phone = "+91 98765 43210";
    email = "netajikalkahaveli@gmail.com";
    address = "Kalka Haveli, Kalka, Haryana 133302";
  };

  // ── Seed Default Admin ─────────────────────────────────────────────
  // SHA-256("Shashi@1234") = c0ec78e83524f311d98306add543b7cc1c8c94cea368c6044f21d01d73e5b05e

  func seedDefaultAdmin() {
    if (isSeeded) { return };
    if (admins.containsKey("shashisingh6745@gmail.com")) {
      isSeeded := true;
      return;
    };
    let account : AdminAccount = {
      id = 0;
      email = "shashisingh6745@gmail.com";
      passwordHash = "c0ec78e83524f311d98306add543b7cc1c8c94cea368c6044f21d01d73e5b05e";
      role = #mainAdmin;
    };
    admins.add("shashisingh6745@gmail.com", account);
    mustChangePwd.add("shashisingh6745@gmail.com", true);
    adminCounter := 1;
    isSeeded := true;
  };

  // ── Internal Helpers ───────────────────────────────────────────────

  func getSession(token : Text) : ?AdminSession {
    switch (sessions.get(token)) {
      case (null) { null };
      case (?s) {
        if ((Time.now() : Int) < s.expiresAt) { ?s } else {
          sessions.remove(token);
          null;
        };
      };
    };
  };

  func requireSession(token : Text) : AdminSession {
    switch (getSession(token)) {
      case (null) { Runtime.trap("Unauthorized: Invalid or expired session") };
      case (?s) { s };
    };
  };

  func requireMainAdmin(token : Text) : AdminSession {
    let s = requireSession(token);
    if (s.role != #mainAdmin) {
      Runtime.trap("Unauthorized: Main admin access required");
    };
    s;
  };

  func makeToken() : Text {
    let now = Time.now();
    let t = "tok_" # sessionCounter.toText() # "_" # now.toText();
    sessionCounter += 1;
    t;
  };

  func getMustChangePwd(email : Text) : Bool {
    switch (mustChangePwd.get(email)) {
      case (?v) { v };
      case (null) { false };
    };
  };

  // ── Auth ───────────────────────────────────────────────────────────

  public func login(email : Text, passwordHash : Text) : async ?Text {
    seedDefaultAdmin();
    switch (admins.get(email)) {
      case (null) { null };
      case (?account) {
        if (account.passwordHash != passwordHash) { return null };
        let token = makeToken();
        let session : AdminSession = {
          adminId = account.id;
          email = account.email;
          role = account.role;
          expiresAt = (Time.now() : Int) + 24 * 60 * 60 * 1_000_000_000;
        };
        sessions.add(token, session);
        ?token;
      };
    };
  };

  public query func validateToken(token : Text) : async ?SessionInfo {
    switch (sessions.get(token)) {
      case (null) { null };
      case (?s) {
        if ((Time.now() : Int) < s.expiresAt) {
          ?{ email = s.email; role = s.role; mustChangePassword = getMustChangePwd(s.email) };
        } else {
          null;
        };
      };
    };
  };

  public func logout(token : Text) : async () {
    sessions.remove(token);
  };

  // ── Password Management ────────────────────────────────────────────

  public func changePassword(token : Text, oldHash : Text, newHash : Text) : async Bool {
    let s = requireSession(token);
    switch (admins.get(s.email)) {
      case (null) { false };
      case (?account) {
        if (account.passwordHash != oldHash) { return false };
        admins.add(s.email, { account with passwordHash = newHash });
        mustChangePwd.add(s.email, false);
        true;
      };
    };
  };

  public func adminResetPassword(token : Text, targetEmail : Text, newHash : Text) : async Bool {
    let _ = requireMainAdmin(token);
    switch (admins.get(targetEmail)) {
      case (null) { Runtime.trap("Account not found") };
      case (?account) {
        admins.add(targetEmail, { account with passwordHash = newHash });
        mustChangePwd.add(targetEmail, true);
        true;
      };
    };
  };

  // ── Account Management ─────────────────────────────────────────────

  public func createAccount(token : Text, email : Text, passwordHash : Text, role : AdminRole) : async Bool {
    let _ = requireMainAdmin(token);
    if (role == #mainAdmin) {
      Runtime.trap("Cannot create a mainAdmin account this way");
    };
    if (admins.containsKey(email)) {
      Runtime.trap("An account with this email already exists");
    };
    let account : AdminAccount = {
      id = adminCounter;
      email = email;
      passwordHash = passwordHash;
      role = role;
    };
    admins.add(email, account);
    mustChangePwd.add(email, true);
    adminCounter += 1;
    true;
  };

  public func removeAccount(token : Text, targetEmail : Text) : async Bool {
    let _ = requireMainAdmin(token);
    switch (admins.get(targetEmail)) {
      case (null) { Runtime.trap("Account not found") };
      case (?a) {
        if (a.role == #mainAdmin) {
          Runtime.trap("Cannot remove the main admin account");
        };
        admins.remove(targetEmail);
        mustChangePwd.remove(targetEmail);
        true;
      };
    };
  };

  public func transferMainAdmin(token : Text, targetEmail : Text) : async Bool {
    let s = requireMainAdmin(token);
    switch (admins.get(s.email)) {
      case (null) { Runtime.trap("Current account not found") };
      case (?currentAccount) {
        switch (admins.get(targetEmail)) {
          case (null) { Runtime.trap("Target account not found") };
          case (?targetAccount) {
            if (targetEmail == s.email) {
              Runtime.trap("Cannot transfer to yourself");
            };
            admins.add(s.email, { currentAccount with role = #admin });
            admins.add(targetEmail, { targetAccount with role = #mainAdmin });
            sessions.remove(token);
            true;
          };
        };
      };
    };
  };

  public query func listAccounts(token : Text) : async [AccountInfo] {
    switch (sessions.get(token)) {
      case (null) { Runtime.trap("Unauthorized") };
      case (?s) {
        if ((Time.now() : Int) >= s.expiresAt) { Runtime.trap("Session expired") };
        if (s.role != #mainAdmin) { Runtime.trap("Main admin access required") };
        admins.values().toArray().map(func(a : AdminAccount) : AccountInfo {
          { id = a.id; email = a.email; role = a.role };
        });
      };
    };
  };

  // ── Restaurant Info ────────────────────────────────────────────────

  public query func getRestaurantInfo() : async RestaurantInfo {
    restaurantInfo;
  };

  public func updateRestaurantInfo(token : Text, phone : Text, email : Text, address : Text) : async Bool {
    let _ = requireMainAdmin(token);
    restaurantInfo := { phone = phone; email = email; address = address };
    true;
  };

  // ── Menu Management ────────────────────────────────────────────────

  public func initializeMenu(token : Text) : async () {
    let _ = requireSession(token);
    if (isMenuInitialized) { Runtime.trap("Already initialized") };
    let initialItems : [MenuItem] = [
      { id = nextMenuItemId;     name = "Paneer Butter Masala"; description = "Creamy cottage cheese curry with rich tomato gravy"; price = "\u{20B9}220"; category = "Veg";     isAvailable = true },
      { id = nextMenuItemId + 1; name = "Chicken Biryani";      description = "Flavourful rice dish with tender chicken pieces";    price = "\u{20B9}300"; category = "Non-Veg"; isAvailable = true },
      { id = nextMenuItemId + 2; name = "Masala Dosa";          description = "Crispy rice crepe with spicy potato filling";        price = "\u{20B9}120"; category = "Veg";     isAvailable = true },
      { id = nextMenuItemId + 3; name = "Butter Chicken";       description = "Juicy chicken in creamy tomato sauce";             price = "\u{20B9}280"; category = "Non-Veg"; isAvailable = true },
      { id = nextMenuItemId + 4; name = "Mango Lassi";          description = "Sweet mango flavored yogurt drink";                price = "\u{20B9}70";  category = "Drinks";  isAvailable = true },
      { id = nextMenuItemId + 5; name = "Tandoori Roti";        description = "Whole wheat flatbread cooked in tandoor";          price = "\u{20B9}25";  category = "Breads";  isAvailable = true },
    ];
    for (item in initialItems.vals()) { menuItems.add(item.id, item) };
    nextMenuItemId += 6;
    isMenuInitialized := true;
  };

  public func createMenuItem(token : Text, name : Text, description : Text, price : Text, category : Text) : async Nat {
    let _ = requireSession(token);
    let id = nextMenuItemId;
    menuItems.add(id, { id; name; description; price; category; isAvailable = true });
    nextMenuItemId += 1;
    id;
  };

  public func updateMenuItem(token : Text, id : Nat, name : Text, description : Text, price : Text, category : Text, isAvailable : Bool) : async () {
    let _ = requireSession(token);
    switch (menuItems.get(id)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?_) { menuItems.add(id, { id; name; description; price; category; isAvailable }) };
    };
  };

  public func deleteMenuItem(token : Text, id : Nat) : async () {
    let _ = requireSession(token);
    if (not menuItems.containsKey(id)) { Runtime.trap("Menu item not found") };
    menuItems.remove(id);
  };

  public query func getAllAvailableMenuItems() : async [MenuItem] {
    menuItems.values().toArray().filter(func(item : MenuItem) : Bool { item.isAvailable }).sort();
  };

  public query func getMenuItemsByCategory(category : Text) : async [MenuItem] {
    menuItems.values().toArray().filter(func(item : MenuItem) : Bool { item.category == category and item.isAvailable }).sort();
  };

  public query func getAllMenuItems(token : Text) : async [MenuItem] {
    switch (sessions.get(token)) {
      case (null) { Runtime.trap("Unauthorized") };
      case (?s) {
        if ((Time.now() : Int) >= s.expiresAt) { Runtime.trap("Session expired") };
        menuItems.values().toArray().sort();
      };
    };
  };

  // ── Gallery ────────────────────────────────────────────────────────

  public func addGalleryImage(token : Text, url : Text, caption : Text) : async () {
    let _ = requireSession(token);
    galleryImages.add({ url; caption });
  };

  public func deleteGalleryImage(token : Text, url : Text) : async () {
    let _ = requireSession(token);
    let filtered = galleryImages.filter(func(img : GalleryImage) : Bool { img.url != url });
    galleryImages.clear();
    galleryImages.addAll(filtered.values());
  };

  public query func getAllGalleryImages() : async [GalleryImage] {
    galleryImages.toArray().sort();
  };

  // ── Contact Messages ───────────────────────────────────────────────

  public func submitContactMessage(name : Text, phone : Text, message : Text) : async () {
    contactMessages.add({ name; phone; message; timestamp = Time.now() });
  };

  public query func getAllContactMessages(token : Text) : async [ContactMessage] {
    switch (sessions.get(token)) {
      case (null) { Runtime.trap("Unauthorized") };
      case (?s) {
        if ((Time.now() : Int) >= s.expiresAt) { Runtime.trap("Session expired") };
        contactMessages.toArray().sort();
      };
    };
  };

  // ── Stats ──────────────────────────────────────────────────────────

  public query func getStats() : async (Nat, Nat, Nat) {
    (menuItems.size(), contactMessages.size(), galleryImages.size());
  };

};
