import {
  User, InsertUser, Task, InsertTask, TaskAssignment, InsertTaskAssignment,
  ServiceSheet, InsertServiceSheet, Note, InsertNote, Photo, InsertPhoto,
  Product, InsertProduct, ProductUsage, InsertProductUsage, Timesheet, InsertTimesheet,
  Client, InsertClient
} from "@shared/schema";

// Interface defining all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTasksByStatus(status: string): Promise<Task[]>;
  getTasksByPriority(priority: string): Promise<Task[]>;
  getTasksByDate(date: Date): Promise<Task[]>;
  getTasksForUser(userId: number): Promise<Task[]>;

  // Task assignments
  getTaskAssignments(taskId: number): Promise<TaskAssignment[]>;
  createTaskAssignment(assignment: InsertTaskAssignment): Promise<TaskAssignment>;
  removeTaskAssignment(taskId: number, userId: number): Promise<boolean>;

  // Service sheets
  getServiceSheet(taskId: number): Promise<ServiceSheet | undefined>;
  createServiceSheet(sheet: InsertServiceSheet): Promise<ServiceSheet>;
  updateServiceSheet(id: number, sheet: Partial<InsertServiceSheet>): Promise<ServiceSheet | undefined>;

  // Notes
  getTaskNotes(taskId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  deleteNote(id: number): Promise<boolean>;

  // Photos
  getTaskPhotos(taskId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<boolean>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getLowStockProducts(): Promise<Product[]>;

  // Product usage
  getTaskProductUsage(taskId: number): Promise<ProductUsage[]>;
  createProductUsage(usage: InsertProductUsage): Promise<ProductUsage>;
  updateProductUsage(id: number, usage: Partial<InsertProductUsage>): Promise<ProductUsage | undefined>;
  deleteProductUsage(id: number): Promise<boolean>;

  // Timesheets
  getTimesheets(): Promise<Timesheet[]>;
  getUserTimesheets(userId: number): Promise<Timesheet[]>;
  getTaskTimesheets(taskId: number): Promise<Timesheet[]>;
  createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet>;
  updateTimesheet(id: number, timesheet: Partial<InsertTimesheet>): Promise<Timesheet | undefined>;
  deleteTimesheet(id: number): Promise<boolean>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private taskAssignments: Map<number, TaskAssignment>;
  private serviceSheets: Map<number, ServiceSheet>;
  private notes: Map<number, Note>;
  private photos: Map<number, Photo>;
  private products: Map<number, Product>;
  private productUsage: Map<number, ProductUsage>;
  private timesheets: Map<number, Timesheet>;
  private clients: Map<number, Client>;

  private userIdCounter: number;
  private taskIdCounter: number;
  private taskAssignmentIdCounter: number;
  private serviceSheetIdCounter: number;
  private noteIdCounter: number;
  private photoIdCounter: number;
  private productIdCounter: number;
  private productUsageIdCounter: number;
  private timesheetIdCounter: number;
  private clientIdCounter: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.taskAssignments = new Map();
    this.serviceSheets = new Map();
    this.notes = new Map();
    this.photos = new Map();
    this.products = new Map();
    this.productUsage = new Map();
    this.timesheets = new Map();
    this.clients = new Map();

    this.userIdCounter = 1;
    this.taskIdCounter = 1;
    this.taskAssignmentIdCounter = 1;
    this.serviceSheetIdCounter = 1;
    this.noteIdCounter = 1;
    this.photoIdCounter = 1;
    this.productIdCounter = 1;
    this.productUsageIdCounter = 1;
    this.timesheetIdCounter = 1;
    this.clientIdCounter = 1;

    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample user
    const user: InsertUser = {
      username: 'john.smith',
      password: 'password123',
      name: 'John Smith',
      role: 'technician'
    };
    this.createUser(user);

    // Create sample technicians
    const tech2: InsertUser = {
      username: 'tech2',
      password: 'password123',
      name: 'Thomas Miller',
      role: 'technician'
    };
    this.createUser(tech2);
    
    const tech3: InsertUser = {
      username: 'tech3',
      password: 'password123',
      name: 'Robert King',
      role: 'technician'
    };
    this.createUser(tech3);
    
    const tech4: InsertUser = {
      username: 'tech4',
      password: 'password123',
      name: 'Amy Lee',
      role: 'technician'
    };
    this.createUser(tech4);

    // Create sample clients
    const client1: InsertClient = {
      name: 'ABC Corporation',
      contactName: 'Jane Doe',
      phone: '555-123-4567',
      email: 'jane@abccorp.com',
      address: '123 Main St, Suite 101'
    };
    const createdClient1 = this.createClient(client1);

    const client2: InsertClient = {
      name: 'XYZ Industries',
      contactName: 'Bob Johnson',
      phone: '555-987-6543',
      email: 'bob@xyzindustries.com',
      address: '456 Park Ave, Floor 2'
    };
    const createdClient2 = this.createClient(client2);
    
    const client3: InsertClient = {
      name: 'Acme Co.',
      contactName: 'Susan Brown',
      phone: '555-456-7890',
      email: 'susan@acmeco.com',
      address: '789 Oak St, Unit 5'
    };
    const createdClient3 = this.createClient(client3);

    // Create sample products
    const product1: InsertProduct = {
      name: 'HVAC Air Filter',
      sku: 'HVF-001',
      description: 'High-efficiency air filter for commercial HVAC systems',
      unitPrice: 24.99,
      stockQuantity: 2,
      lowStockThreshold: 5,
      category: 'HVAC'
    };
    this.createProduct(product1);

    const product2: InsertProduct = {
      name: 'Copper Fittings (3/4")',
      sku: 'CPF-001',
      description: '3/4-inch copper pipe fittings for plumbing installations',
      unitPrice: 8.50,
      stockQuantity: 2,
      lowStockThreshold: 10,
      category: 'Plumbing'
    };
    this.createProduct(product2);

    const product3: InsertProduct = {
      name: 'Wire Connectors',
      sku: 'WRC-001',
      description: 'Electrical wire connectors for secure connections',
      unitPrice: 5.99,
      stockQuantity: 5,
      lowStockThreshold: 10,
      category: 'Electrical'
    };
    this.createProduct(product3);

    const product4: InsertProduct = {
      name: 'Thermostat',
      sku: 'THR-001',
      description: 'Digital programmable thermostat',
      unitPrice: 89.99,
      stockQuantity: 15,
      lowStockThreshold: 3,
      category: 'HVAC'
    };
    this.createProduct(product4);

    // Create sample tasks
    const now = new Date();
    
    // Task 1 - HVAC Maintenance (in progress)
    const task1: InsertTask = {
      title: 'HVAC Maintenance',
      description: 'Commercial AC unit maintenance and filter replacement. Customer reported uneven cooling in office space.',
      locationName: 'Acme Co. Office',
      locationAddress: '789 Oak St, Unit 5',
      scheduledDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0), // Today 1:00 PM
      status: 'in_progress',
      priority: 'high',
      progress: 65,
      clientId: createdClient3.id
    };
    const createdTask1 = this.createTask(task1);
    
    // Assign task 1 to John and Thomas
    this.createTaskAssignment({ taskId: createdTask1.id, userId: 1 });
    this.createTaskAssignment({ taskId: createdTask1.id, userId: 2 });
    
    // Create service sheet for task 1
    this.createServiceSheet({
      taskId: createdTask1.id,
      serviceType: 'maintenance',
      equipmentType: 'HVAC System',
      checklist: [
        { id: 1, name: 'Inspect equipment', completed: true },
        { id: 2, name: 'Test functionality', completed: true },
        { id: 3, name: 'Clean components', completed: false },
        { id: 4, name: 'Replace parts as needed', completed: false },
      ]
    });
    
    // Create product usage for task 1
    this.createProductUsage({
      taskId: createdTask1.id,
      productId: 1, // HVAC Air Filter
      quantity: 2
    });
    
    // Create notes for task 1
    this.createNote({
      taskId: createdTask1.id,
      userId: 1,
      content: 'Found dust build-up in ventilation system. Will need additional cleaning.'
    });
    
    // Create timesheet for task 1
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 1);
    this.createTimesheet({
      taskId: createdTask1.id,
      userId: 1,
      startTime: startTime,
      durationMinutes: 60,
      notes: 'Initial inspection and filter replacement'
    });
    
    // Task 2 - Electrical Repair (completed)
    const task2: InsertTask = {
      title: 'Electrical Repair',
      description: 'Circuit breaker replacement and electrical panel inspection. Customer reported frequent power outages.',
      locationName: 'XYZ Industries Office',
      locationAddress: '456 Park Ave, Floor 2',
      scheduledDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30), // Today 11:30 AM
      status: 'completed',
      priority: 'medium',
      progress: 100,
      clientId: createdClient2.id
    };
    const createdTask2 = this.createTask(task2);
    
    // Assign task 2 to John
    this.createTaskAssignment({ taskId: createdTask2.id, userId: 1 });
    
    // Create service sheet for task 2
    this.createServiceSheet({
      taskId: createdTask2.id,
      serviceType: 'repair',
      equipmentType: 'Electrical Panel',
      checklist: [
        { id: 1, name: 'Inspect circuit breakers', completed: true },
        { id: 2, name: 'Test electrical load', completed: true },
        { id: 3, name: 'Replace faulty components', completed: true },
        { id: 4, name: 'Verify operation', completed: true },
      ]
    });
    
    // Create timesheet for task 2
    const task2Start = new Date();
    task2Start.setHours(task2Start.getHours() - 3);
    this.createTimesheet({
      taskId: createdTask2.id,
      userId: 1,
      startTime: task2Start,
      endTime: new Date(task2Start.getTime() + 2 * 60 * 60 * 1000),
      durationMinutes: 120,
      notes: 'Complete electrical panel inspection and repair'
    });
    
    // Task 3 - Security System Check (scheduled)
    const task3: InsertTask = {
      title: 'Security System Check',
      description: 'Annual security system check and camera alignment. Update firmware on security devices.',
      locationName: 'Pine Residence',
      locationAddress: '321 Pine Ave',
      scheduledDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30), // Today 3:30 PM
      status: 'scheduled',
      priority: 'low',
      progress: 0,
      clientId: null
    };
    const createdTask3 = this.createTask(task3);
    
    // Assign task 3 to Robert
    this.createTaskAssignment({ taskId: createdTask3.id, userId: 3 });
    
    // Task 4 - Equipment Servicing (scheduled)
    const task4: InsertTask = {
      title: 'Equipment Servicing',
      description: 'Quarterly maintenance of industrial kitchen equipment. Inspect refrigeration units and cooking appliances.',
      locationName: 'Cedar Road Restaurant',
      locationAddress: '567 Cedar Rd, Floor 3',
      scheduledDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0), // Today 5:00 PM
      status: 'scheduled',
      priority: 'medium',
      progress: 0,
      clientId: null
    };
    const createdTask4 = this.createTask(task4);
    
    // Assign task 4 to John and Amy
    this.createTaskAssignment({ taskId: createdTask4.id, userId: 1 });
    this.createTaskAssignment({ taskId: createdTask4.id, userId: 4 });
    
    // Task 5 - Plumbing Installation (scheduled for tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const task5: InsertTask = {
      title: 'Plumbing Installation',
      description: 'Install new plumbing fixtures in restroom area. Replace old piping and ensure proper drainage.',
      locationName: 'Downtown Office Building',
      locationAddress: '888 Main St, Suite 200',
      scheduledDate: tomorrow,
      status: 'scheduled',
      priority: 'medium',
      progress: 0,
      clientId: null
    };
    this.createTask(task5);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Task operations
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: new Date()
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  async getTasksByPriority(priority: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.priority === priority);
  }

  async getTasksByDate(date: Date): Promise<Task[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return Array.from(this.tasks.values()).filter(task => {
      const taskDate = new Date(task.scheduledDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === targetDate.getTime();
    });
  }

  async getTasksForUser(userId: number): Promise<Task[]> {
    const userAssignments = Array.from(this.taskAssignments.values())
      .filter(assignment => assignment.userId === userId);
      
    const taskIds = userAssignments.map(assignment => assignment.taskId);
    
    return Array.from(this.tasks.values())
      .filter(task => taskIds.includes(task.id));
  }

  // Task assignments
  async getTaskAssignments(taskId: number): Promise<TaskAssignment[]> {
    return Array.from(this.taskAssignments.values())
      .filter(assignment => assignment.taskId === taskId);
  }

  async createTaskAssignment(insertAssignment: InsertTaskAssignment): Promise<TaskAssignment> {
    const id = this.taskAssignmentIdCounter++;
    const assignment: TaskAssignment = {
      ...insertAssignment,
      id,
      assignedAt: new Date()
    };
    this.taskAssignments.set(id, assignment);
    return assignment;
  }

  async removeTaskAssignment(taskId: number, userId: number): Promise<boolean> {
    const assignment = Array.from(this.taskAssignments.values())
      .find(a => a.taskId === taskId && a.userId === userId);
      
    if (!assignment) return false;
    
    return this.taskAssignments.delete(assignment.id);
  }

  // Service sheets
  async getServiceSheet(taskId: number): Promise<ServiceSheet | undefined> {
    return Array.from(this.serviceSheets.values())
      .find(sheet => sheet.taskId === taskId);
  }

  async createServiceSheet(insertSheet: InsertServiceSheet): Promise<ServiceSheet> {
    const id = this.serviceSheetIdCounter++;
    const now = new Date();
    const sheet: ServiceSheet = {
      ...insertSheet,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.serviceSheets.set(id, sheet);
    return sheet;
  }

  async updateServiceSheet(id: number, updates: Partial<InsertServiceSheet>): Promise<ServiceSheet | undefined> {
    const sheet = this.serviceSheets.get(id);
    if (!sheet) return undefined;
    
    const updatedSheet: ServiceSheet = {
      ...sheet,
      ...updates,
      updatedAt: new Date()
    };
    
    this.serviceSheets.set(id, updatedSheet);
    return updatedSheet;
  }

  // Notes
  async getTaskNotes(taskId: number): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter(note => note.taskId === taskId);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteIdCounter++;
    const note: Note = {
      ...insertNote,
      id,
      createdAt: new Date()
    };
    this.notes.set(id, note);
    return note;
  }

  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Photos
  async getTaskPhotos(taskId: number): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(photo => photo.taskId === taskId);
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.photoIdCounter++;
    const photo: Photo = {
      ...insertPhoto,
      id,
      uploadedAt: new Date()
    };
    this.photos.set(id, photo);
    return photo;
  }

  async deletePhoto(id: number): Promise<boolean> {
    return this.photos.delete(id);
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const now = new Date();
    const product: Product = {
      ...insertProduct,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct: Product = {
      ...product,
      ...updates,
      updatedAt: new Date()
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async getLowStockProducts(): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.stockQuantity <= product.lowStockThreshold);
  }

  // Product usage
  async getTaskProductUsage(taskId: number): Promise<ProductUsage[]> {
    return Array.from(this.productUsage.values())
      .filter(usage => usage.taskId === taskId);
  }

  async createProductUsage(insertUsage: InsertProductUsage): Promise<ProductUsage> {
    const id = this.productUsageIdCounter++;
    const usage: ProductUsage = {
      ...insertUsage,
      id,
      usedAt: new Date()
    };
    this.productUsage.set(id, usage);
    
    // Update product stock quantity
    const product = this.products.get(insertUsage.productId);
    if (product) {
      const updatedProduct = {
        ...product,
        stockQuantity: Math.max(0, product.stockQuantity - insertUsage.quantity),
        updatedAt: new Date()
      };
      this.products.set(product.id, updatedProduct);
    }
    
    return usage;
  }

  async updateProductUsage(id: number, updates: Partial<InsertProductUsage>): Promise<ProductUsage | undefined> {
    const usage = this.productUsage.get(id);
    if (!usage) return undefined;
    
    // If quantity is being updated, adjust product stock accordingly
    if (updates.quantity !== undefined && usage.productId === updates.productId) {
      const product = this.products.get(usage.productId);
      if (product) {
        const quantityDifference = updates.quantity - usage.quantity;
        const updatedProduct = {
          ...product,
          stockQuantity: Math.max(0, product.stockQuantity - quantityDifference),
          updatedAt: new Date()
        };
        this.products.set(product.id, updatedProduct);
      }
    }
    
    const updatedUsage: ProductUsage = {
      ...usage,
      ...updates,
      usedAt: new Date()
    };
    
    this.productUsage.set(id, updatedUsage);
    return updatedUsage;
  }

  async deleteProductUsage(id: number): Promise<boolean> {
    const usage = this.productUsage.get(id);
    if (!usage) return false;
    
    // Return quantities to stock
    const product = this.products.get(usage.productId);
    if (product) {
      const updatedProduct = {
        ...product,
        stockQuantity: product.stockQuantity + usage.quantity,
        updatedAt: new Date()
      };
      this.products.set(product.id, updatedProduct);
    }
    
    return this.productUsage.delete(id);
  }

  // Timesheets
  async getTimesheets(): Promise<Timesheet[]> {
    return Array.from(this.timesheets.values());
  }

  async getUserTimesheets(userId: number): Promise<Timesheet[]> {
    return Array.from(this.timesheets.values())
      .filter(timesheet => timesheet.userId === userId);
  }

  async getTaskTimesheets(taskId: number): Promise<Timesheet[]> {
    return Array.from(this.timesheets.values())
      .filter(timesheet => timesheet.taskId === taskId);
  }

  async createTimesheet(insertTimesheet: InsertTimesheet): Promise<Timesheet> {
    const id = this.timesheetIdCounter++;
    
    let durationMinutes = insertTimesheet.durationMinutes;
    if (insertTimesheet.endTime && !durationMinutes) {
      // Calculate duration if end time is provided but duration is not
      const startTime = new Date(insertTimesheet.startTime).getTime();
      const endTime = new Date(insertTimesheet.endTime).getTime();
      durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
    }
    
    const timesheet: Timesheet = {
      ...insertTimesheet,
      id,
      durationMinutes,
      createdAt: new Date()
    };
    this.timesheets.set(id, timesheet);
    return timesheet;
  }

  async updateTimesheet(id: number, updates: Partial<InsertTimesheet>): Promise<Timesheet | undefined> {
    const timesheet = this.timesheets.get(id);
    if (!timesheet) return undefined;
    
    let durationMinutes = updates.durationMinutes !== undefined 
      ? updates.durationMinutes 
      : timesheet.durationMinutes;
      
    const startTime = updates.startTime || timesheet.startTime;
    const endTime = updates.endTime || timesheet.endTime;
    
    if (endTime && startTime && !updates.durationMinutes) {
      // Recalculate duration if start/end times change but duration not explicitly set
      const startMs = new Date(startTime).getTime();
      const endMs = new Date(endTime).getTime();
      durationMinutes = Math.round((endMs - startMs) / (1000 * 60));
    }
    
    const updatedTimesheet: Timesheet = {
      ...timesheet,
      ...updates,
      durationMinutes,
    };
    
    this.timesheets.set(id, updatedTimesheet);
    return updatedTimesheet;
  }

  async deleteTimesheet(id: number): Promise<boolean> {
    return this.timesheets.delete(id);
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const client: Client = {
      ...insertClient,
      id,
      createdAt: new Date()
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient: Client = {
      ...client,
      ...updates
    };
    
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }
}

export const storage = new MemStorage();
