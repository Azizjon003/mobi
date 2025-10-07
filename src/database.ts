import { Document, UserSession, User, UserRole } from './types';
import * as fs from 'fs';
import * as path from 'path';

class Database {
  private documents: Document[] = [];
  private users: User[] = [];
  private dbPath = path.join(__dirname, '..', 'data', 'documents.json');
  private usersPath = path.join(__dirname, '..', 'data', 'users.json');

  constructor() {
    this.ensureDirectories();
    this.loadData();
    this.loadUsers();
  }

  private ensureDirectories() {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        this.documents = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.documents = [];
    }
  }

  private saveData() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.documents, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  addDocument(doc: Document) {
    this.documents.push(doc);
    this.saveData();
  }

  searchDocuments(query: string): Document[] {
    const lowerQuery = query.toLowerCase();
    return this.documents.filter(doc =>
      doc.fullName.toLowerCase().includes(lowerQuery) ||
      doc.applicationNumber.toLowerCase().includes(lowerQuery)
    );
  }

  contractNumberExists(applicationNumber: string): boolean {
    return this.documents.some(doc =>
      doc.applicationNumber.toLowerCase() === applicationNumber.toLowerCase()
    );
  }

  getAllDocuments(): Document[] {
    return this.documents;
  }

  // User management methods
  private loadUsers() {
    try {
      if (fs.existsSync(this.usersPath)) {
        const data = fs.readFileSync(this.usersPath, 'utf-8');
        this.users = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
    }
  }

  private saveUsers() {
    try {
      fs.writeFileSync(this.usersPath, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  addUser(userId: number, role: UserRole, addedBy: number): boolean {
    if (this.users.find(u => u.userId === userId)) {
      return false;
    }
    this.users.push({
      userId,
      role,
      addedAt: new Date(),
      addedBy
    });
    this.saveUsers();
    return true;
  }

  removeUser(userId: number): boolean {
    const index = this.users.findIndex(u => u.userId === userId);
    if (index === -1) {
      return false;
    }
    this.users.splice(index, 1);
    this.saveUsers();
    return true;
  }

  updateUserRole(userId: number, newRole: UserRole): boolean {
    const user = this.users.find(u => u.userId === userId);
    if (!user) {
      return false;
    }
    user.role = newRole;
    this.saveUsers();
    return true;
  }

  getUser(userId: number): User | undefined {
    return this.users.find(u => u.userId === userId);
  }

  getUserRole(userId: number): UserRole | undefined {
    const user = this.users.find(u => u.userId === userId);
    return user?.role;
  }

  getAllUsers(): User[] {
    return [...this.users];
  }

  getUsersByRole(role: UserRole): User[] {
    return this.users.filter(u => u.role === role);
  }

  isAuthorized(userId: number): boolean {
    return this.users.some(u => u.userId === userId);
  }

  // Backward compatibility methods
  getAllAdmins(): number[] {
    return this.users.map(u => u.userId);
  }

  isAdmin(userId: number): boolean {
    return this.users.some(u => u.userId === userId);
  }
}

export const db = new Database();
