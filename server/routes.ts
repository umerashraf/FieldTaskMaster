import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertTaskSchema, 
  insertServiceSheetSchema, 
  insertNoteSchema, 
  insertProductSchema, 
  insertProductUsageSchema, 
  insertTimesheetSchema, 
  insertClientSchema 
} from "@shared/schema";

// Configure multer for file uploads
const createUploadsDir = () => {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, createUploadsDir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: fileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed') as any, false);
    }
  }
});

// Helper function to handle validation and async operations
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      console.error('Error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          message: error instanceof Error ? error.message : 'An unknown error occurred'
        });
      }
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // CORS and static file setup
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // User routes
  app.get('/api/users', asyncHandler(async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  }));

  app.get('/api/users/:id', asyncHandler(async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  }));

  // Task routes
  app.get('/api/tasks', asyncHandler(async (req, res) => {
    let tasks;
    
    // Filter tasks based on query parameters
    if (req.query.status) {
      tasks = await storage.getTasksByStatus(req.query.status as string);
    } else if (req.query.priority) {
      tasks = await storage.getTasksByPriority(req.query.priority as string);
    } else if (req.query.date) {
      tasks = await storage.getTasksByDate(new Date(req.query.date as string));
    } else if (req.query.userId) {
      tasks = await storage.getTasksForUser(Number(req.query.userId));
    } else {
      tasks = await storage.getTasks();
    }
    
    // Get assignments for each task
    const tasksWithAssignments = await Promise.all(tasks.map(async (task) => {
      const assignments = await storage.getTaskAssignments(task.id);
      const assignedUsers = await Promise.all(
        assignments.map(async (assignment) => await storage.getUser(assignment.userId))
      );
      
      return {
        ...task,
        assignedUsers: assignedUsers.filter(Boolean) // Filter out any undefined users
      };
    }));
    
    res.json(tasksWithAssignments);
  }));

  app.get('/api/tasks/:id', asyncHandler(async (req, res) => {
    const task = await storage.getTask(Number(req.params.id));
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    
    // Get assignments for the task
    const assignments = await storage.getTaskAssignments(task.id);
    const assignedUsers = await Promise.all(
      assignments.map(async (assignment) => await storage.getUser(assignment.userId))
    );
    
    // Get service sheet if exists
    const serviceSheet = await storage.getServiceSheet(task.id);
    
    // Get notes
    const notes = await storage.getTaskNotes(task.id);
    
    // Get photos
    const photos = await storage.getTaskPhotos(task.id);
    
    // Get product usage
    const productUsage = await storage.getTaskProductUsage(task.id);
    const productsWithDetails = await Promise.all(
      productUsage.map(async (usage) => {
        const product = await storage.getProduct(usage.productId);
        return {
          ...usage,
          product
        };
      })
    );
    
    // Get timesheets
    const timesheets = await storage.getTaskTimesheets(task.id);
    
    // Get client if exists
    let client = null;
    if (task.clientId) {
      client = await storage.getClient(task.clientId);
    }
    
    res.json({
      ...task,
      assignedUsers: assignedUsers.filter(Boolean),
      serviceSheet,
      notes,
      photos,
      productUsage: productsWithDetails,
      timesheets,
      client
    });
  }));

  app.post('/api/tasks', asyncHandler(async (req, res) => {
    const taskData = insertTaskSchema.parse(req.body);
    const task = await storage.createTask(taskData);
    
    // Handle assignments if provided
    if (req.body.assignedUserIds && Array.isArray(req.body.assignedUserIds)) {
      await Promise.all(
        req.body.assignedUserIds.map(async (userId: number) => {
          await storage.createTaskAssignment({ taskId: task.id, userId });
        })
      );
    }
    
    res.status(201).json(task);
  }));

  app.patch('/api/tasks/:id', asyncHandler(async (req, res) => {
    const taskId = Number(req.params.id);
    
    // Validate input
    const updateData = insertTaskSchema.partial().parse(req.body);
    
    // Update task
    const updatedTask = await storage.updateTask(taskId, updateData);
    if (!updatedTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    
    // Handle assignment changes if provided
    if (req.body.assignedUserIds && Array.isArray(req.body.assignedUserIds)) {
      // Get current assignments
      const currentAssignments = await storage.getTaskAssignments(taskId);
      const currentUserIds = currentAssignments.map(a => a.userId);
      
      // Remove users no longer assigned
      for (const userId of currentUserIds) {
        if (!req.body.assignedUserIds.includes(userId)) {
          await storage.removeTaskAssignment(taskId, userId);
        }
      }
      
      // Add new users
      for (const userId of req.body.assignedUserIds) {
        if (!currentUserIds.includes(userId)) {
          await storage.createTaskAssignment({ taskId, userId });
        }
      }
    }
    
    res.json(updatedTask);
  }));

  app.delete('/api/tasks/:id', asyncHandler(async (req, res) => {
    const success = await storage.deleteTask(Number(req.params.id));
    if (!success) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    res.status(204).send();
  }));

  // Service Sheet routes
  app.get('/api/tasks/:taskId/service-sheet', asyncHandler(async (req, res) => {
    const serviceSheet = await storage.getServiceSheet(Number(req.params.taskId));
    if (!serviceSheet) {
      res.status(404).json({ message: 'Service sheet not found' });
      return;
    }
    res.json(serviceSheet);
  }));

  app.post('/api/service-sheets', asyncHandler(async (req, res) => {
    const sheetData = insertServiceSheetSchema.parse(req.body);
    
    // Check if task exists
    const task = await storage.getTask(sheetData.taskId);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    
    // Check if service sheet already exists
    const existingSheet = await storage.getServiceSheet(sheetData.taskId);
    if (existingSheet) {
      res.status(409).json({ message: 'Service sheet already exists for this task' });
      return;
    }
    
    const serviceSheet = await storage.createServiceSheet(sheetData);
    res.status(201).json(serviceSheet);
  }));

  app.patch('/api/service-sheets/:id', asyncHandler(async (req, res) => {
    const sheetData = insertServiceSheetSchema.partial().parse(req.body);
    const updatedSheet = await storage.updateServiceSheet(Number(req.params.id), sheetData);
    
    if (!updatedSheet) {
      res.status(404).json({ message: 'Service sheet not found' });
      return;
    }
    
    res.json(updatedSheet);
  }));

  // Notes routes
  app.get('/api/tasks/:taskId/notes', asyncHandler(async (req, res) => {
    const notes = await storage.getTaskNotes(Number(req.params.taskId));
    res.json(notes);
  }));

  app.post('/api/notes', asyncHandler(async (req, res) => {
    const noteData = insertNoteSchema.parse(req.body);
    const note = await storage.createNote(noteData);
    res.status(201).json(note);
  }));

  app.delete('/api/notes/:id', asyncHandler(async (req, res) => {
    const success = await storage.deleteNote(Number(req.params.id));
    if (!success) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }
    res.status(204).send();
  }));

  // Photo upload routes
  app.post('/api/photos/upload', upload.single('photo'), asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    
    const taskId = Number(req.body.taskId);
    const userId = Number(req.body.userId);
    
    // Validate task and user exist
    const task = await storage.getTask(taskId);
    const user = await storage.getUser(userId);
    
    if (!task || !user) {
      // If file was uploaded but task/user validation failed, delete the file
      fs.unlinkSync(req.file.path);
      
      if (!task) {
        res.status(404).json({ message: 'Task not found' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
      return;
    }
    
    const photo = await storage.createPhoto({
      taskId,
      userId,
      filename: req.file.filename,
      description: req.body.description || ''
    });
    
    res.status(201).json({
      ...photo,
      url: `/uploads/${photo.filename}`
    });
  }));

  app.get('/api/tasks/:taskId/photos', asyncHandler(async (req, res) => {
    const photos = await storage.getTaskPhotos(Number(req.params.taskId));
    
    // Add URL to each photo
    const photosWithUrls = photos.map(photo => ({
      ...photo,
      url: `/uploads/${photo.filename}`
    }));
    
    res.json(photosWithUrls);
  }));

  app.delete('/api/photos/:id', asyncHandler(async (req, res) => {
    const photo = await storage.getTaskPhotos(0).then(
      photos => photos.find(p => p.id === Number(req.params.id))
    );
    
    if (!photo) {
      res.status(404).json({ message: 'Photo not found' });
      return;
    }
    
    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from storage
    const success = await storage.deletePhoto(Number(req.params.id));
    if (!success) {
      res.status(500).json({ message: 'Failed to delete photo record' });
      return;
    }
    
    res.status(204).send();
  }));

  // Product routes
  app.get('/api/products', asyncHandler(async (req, res) => {
    if (req.query.lowStock === 'true') {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } else {
      const products = await storage.getProducts();
      res.json(products);
    }
  }));

  app.get('/api/products/:id', asyncHandler(async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  }));

  app.post('/api/products', asyncHandler(async (req, res) => {
    const productData = insertProductSchema.parse(req.body);
    const product = await storage.createProduct(productData);
    res.status(201).json(product);
  }));

  app.patch('/api/products/:id', asyncHandler(async (req, res) => {
    const productData = insertProductSchema.partial().parse(req.body);
    const updatedProduct = await storage.updateProduct(Number(req.params.id), productData);
    
    if (!updatedProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    
    res.json(updatedProduct);
  }));

  app.delete('/api/products/:id', asyncHandler(async (req, res) => {
    const success = await storage.deleteProduct(Number(req.params.id));
    if (!success) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(204).send();
  }));

  // Product usage routes
  app.get('/api/tasks/:taskId/products', asyncHandler(async (req, res) => {
    const usages = await storage.getTaskProductUsage(Number(req.params.taskId));
    
    // Get full product details for each usage
    const usagesWithProducts = await Promise.all(
      usages.map(async (usage) => {
        const product = await storage.getProduct(usage.productId);
        return {
          ...usage,
          product
        };
      })
    );
    
    res.json(usagesWithProducts);
  }));

  app.post('/api/product-usage', asyncHandler(async (req, res) => {
    const usageData = insertProductUsageSchema.parse(req.body);
    
    // Verify product exists and has enough stock
    const product = await storage.getProduct(usageData.productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    
    if (product.stockQuantity < usageData.quantity) {
      res.status(400).json({ 
        message: 'Insufficient stock',
        availableQuantity: product.stockQuantity 
      });
      return;
    }
    
    const usage = await storage.createProductUsage(usageData);
    
    // Get updated product info
    const updatedProduct = await storage.getProduct(usageData.productId);
    
    res.status(201).json({
      ...usage,
      product: updatedProduct
    });
  }));

  app.patch('/api/product-usage/:id', asyncHandler(async (req, res) => {
    const usageData = insertProductUsageSchema.partial().parse(req.body);
    
    // If updating quantity or product, verify product has enough stock
    if (usageData.quantity !== undefined || usageData.productId !== undefined) {
      const currentUsage = await storage.getTaskProductUsage(0).then(
        usages => usages.find(u => u.id === Number(req.params.id))
      );
      
      if (!currentUsage) {
        res.status(404).json({ message: 'Product usage not found' });
        return;
      }
      
      const productId = usageData.productId || currentUsage.productId;
      const product = await storage.getProduct(productId);
      
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      
      if (usageData.quantity !== undefined && 
          productId === currentUsage.productId && 
          usageData.quantity > currentUsage.quantity) {
        // Check if there's enough stock for the increase
        const increaseAmount = usageData.quantity - currentUsage.quantity;
        if (product.stockQuantity < increaseAmount) {
          res.status(400).json({ 
            message: 'Insufficient stock',
            availableQuantity: product.stockQuantity 
          });
          return;
        }
      } else if (usageData.productId !== undefined && usageData.productId !== currentUsage.productId) {
        // If changing product, ensure new product has enough stock
        const quantityNeeded = usageData.quantity || currentUsage.quantity;
        if (product.stockQuantity < quantityNeeded) {
          res.status(400).json({ 
            message: 'Insufficient stock',
            availableQuantity: product.stockQuantity 
          });
          return;
        }
      }
    }
    
    const updatedUsage = await storage.updateProductUsage(Number(req.params.id), usageData);
    if (!updatedUsage) {
      res.status(404).json({ message: 'Product usage not found' });
      return;
    }
    
    // Get updated product info
    const updatedProduct = await storage.getProduct(updatedUsage.productId);
    
    res.json({
      ...updatedUsage,
      product: updatedProduct
    });
  }));

  app.delete('/api/product-usage/:id', asyncHandler(async (req, res) => {
    const success = await storage.deleteProductUsage(Number(req.params.id));
    if (!success) {
      res.status(404).json({ message: 'Product usage not found' });
      return;
    }
    res.status(204).send();
  }));

  // Timesheet routes
  app.get('/api/timesheets', asyncHandler(async (req, res) => {
    if (req.query.userId) {
      const timesheets = await storage.getUserTimesheets(Number(req.query.userId));
      res.json(timesheets);
    } else if (req.query.taskId) {
      const timesheets = await storage.getTaskTimesheets(Number(req.query.taskId));
      res.json(timesheets);
    } else {
      const timesheets = await storage.getTimesheets();
      res.json(timesheets);
    }
  }));

  app.post('/api/timesheets', asyncHandler(async (req, res) => {
    const timesheetData = insertTimesheetSchema.parse(req.body);
    const timesheet = await storage.createTimesheet(timesheetData);
    res.status(201).json(timesheet);
  }));

  app.patch('/api/timesheets/:id', asyncHandler(async (req, res) => {
    const timesheetData = insertTimesheetSchema.partial().parse(req.body);
    const updatedTimesheet = await storage.updateTimesheet(Number(req.params.id), timesheetData);
    
    if (!updatedTimesheet) {
      res.status(404).json({ message: 'Timesheet not found' });
      return;
    }
    
    res.json(updatedTimesheet);
  }));

  app.delete('/api/timesheets/:id', asyncHandler(async (req, res) => {
    const success = await storage.deleteTimesheet(Number(req.params.id));
    if (!success) {
      res.status(404).json({ message: 'Timesheet not found' });
      return;
    }
    res.status(204).send();
  }));

  // Client routes
  app.get('/api/clients', asyncHandler(async (req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  }));

  app.get('/api/clients/:id', asyncHandler(async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }
    res.json(client);
  }));

  app.post('/api/clients', asyncHandler(async (req, res) => {
    const clientData = insertClientSchema.parse(req.body);
    const client = await storage.createClient(clientData);
    res.status(201).json(client);
  }));

  app.patch('/api/clients/:id', asyncHandler(async (req, res) => {
    const clientData = insertClientSchema.partial().parse(req.body);
    const updatedClient = await storage.updateClient(Number(req.params.id), clientData);
    
    if (!updatedClient) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }
    
    res.json(updatedClient);
  }));

  app.delete('/api/clients/:id', asyncHandler(async (req, res) => {
    const success = await storage.deleteClient(Number(req.params.id));
    if (!success) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }
    res.status(204).send();
  }));

  // Dashboard stats
  app.get('/api/dashboard/stats', asyncHandler(async (req, res) => {
    const allTasks = await storage.getTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's tasks
    const todaysTasks = allTasks.filter(task => {
      const taskDate = new Date(task.scheduledDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    // Get tasks completed this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday of current week
    
    const completedThisWeek = allTasks.filter(task => {
      const taskDate = new Date(task.scheduledDate);
      return taskDate >= startOfWeek && task.status === 'completed';
    });
    
    // Get low stock products
    const lowStockProducts = await storage.getLowStockProducts();
    
    // Get total hours logged
    const timesheets = await storage.getTimesheets();
    const totalMinutes = timesheets.reduce((sum, timesheet) => {
      return sum + (timesheet.durationMinutes || 0);
    }, 0);
    const hoursLogged = totalMinutes / 60;
    
    // Get materials used (product usage count)
    const allUsages = Array.from(
      (await Promise.all(allTasks.map(task => storage.getTaskProductUsage(task.id))))
        .flat()
    );
    
    const materialUsedCount = allUsages.reduce((sum, usage) => {
      return sum + usage.quantity;
    }, 0);
    
    // Calculate task completion rates
    const completedTasks = allTasks.filter(task => task.status === 'completed');
    const taskCompletionRate = Math.round((completedTasks.length / Math.max(1, allTasks.length)) * 100);
    
    // Mock customer satisfaction and first-time fix rate for the UI
    const customerSatisfaction = 92;
    const firstTimeFixRate = 87;
    
    res.json({
      todaysTaskCount: todaysTasks.length,
      todaysTasksCompleted: todaysTasks.filter(t => t.status === 'completed').length,
      todaysTasksPending: todaysTasks.filter(t => t.status !== 'completed').length,
      completedThisWeek: completedThisWeek.length,
      hoursLogged,
      weeklyHoursTarget: 50,
      materialsUsed: materialUsedCount,
      lowStockCount: lowStockProducts.length,
      taskCompletionRate,
      customerSatisfaction,
      firstTimeFixRate
    });
  }));

  return httpServer;
}
