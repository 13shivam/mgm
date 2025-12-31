# Architecture Documentation

This directory contains architecture diagrams for the macOS Gateway Monitor.

## Diagrams

### 1. System Architecture
High-level component diagram showing:
- Electron main and renderer processes
- Service layer organization
- UI components
- System command interactions
- Event-driven architecture

![System Architecture](system-architecture.png)

### 2. Process Monitoring Sequence
Sequence diagram for process monitoring flow:
- User interaction
- Data collection from macOS
- Service processing
- UI updates
- Real-time refresh cycle

![Process Monitoring Sequence](process-monitoring-sequence.png)

### 3. Security Scanning Sequence
Sequence diagram for security analysis:
- Scan initiation
- Multiple system checks (Gatekeeper, SIP, Firewall, KEXTs)
- Result processing
- User feedback

![Security Scanning Sequence](security-scan-sequence.png)

### 4. Data Flow
Data flow diagram showing:
- System data sources
- IPC communication
- Service layer processing
- UI rendering pipeline
- Admin privilege management

![Data Flow](data-flow.png)

## Architecture Principles

### Modular Design
- Clear separation between main and renderer processes
- Service layer for business logic
- Reusable UI components
- Utility functions for common operations

### Event-Driven
- EventBus for component communication
- IPC for process communication
- Decoupled architecture

### Security First
- Admin privilege management
- Input validation
- Error isolation
- Graceful degradation

### Performance
- Efficient data caching
- Optimized refresh intervals
- Lazy loading
- Resource management
