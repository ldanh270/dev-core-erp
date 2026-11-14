/// <reference types="jest" />
import { EventEmitter } from "events"

import {
  InMemoryCacheService,
  cacheService,
  createCacheService,
} from "../../services/cache.service"

describe("InMemoryCacheService.get", () => {
  let service: InMemoryCacheService

  beforeEach(() => {
    service = new InMemoryCacheService()
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("UTCID01 - returns the cached value when key exists and has not expired", async () => {
    // Arrange
    const key = "test-key"
    const value = { data: "test-value" }
    await service.set(key, value)

    // Act
    const result = await service.get<{ data: string }>(key)

    // Assert
    expect(result).toEqual(value)
  })

  it("UTCID02 - returns null when the key does not exist", async () => {
    // Arrange
    const key = "non-existent-key"

    // Act
    const result = await service.get(key)

    // Assert
    expect(result).toBeNull()
  })

  it("UTCID03 - returns null and deletes the key when it is expired", async () => {
    // Arrange
    const key = "expired-key"
    const value = "expired-value"
    const ttl = 1 // 1 second
    await service.set(key, value, ttl)

    // Fast-forward time by 2 seconds
    jest.advanceTimersByTime(2000)

    // Act
    const result = await service.get(key)
    const secondResult = await service.get(key)

    // Assert
    expect(result).toBeNull()
    expect(secondResult).toBeNull()
  })
})

describe("InMemoryCacheService.set", () => {
  let service: InMemoryCacheService

  beforeEach(() => {
    service = new InMemoryCacheService()
  })

  it("UTCID01 - stores a value in cache without TTL", async () => {
    // Arrange
    const key = "my-key"
    const value = "my-val"

    // Act
    await service.set(key, value)
    const result = await service.get<string>(key)

    // Assert
    expect(result).toBe(value)
  })

  it("UTCID02 - stores a value that expires immediately when negative TTL is provided", async () => {
    // Arrange
    const key = "neg-ttl-key"
    const value = "neg-ttl-val"

    // Act
    await service.set(key, value, -1)
    const result = await service.get(key)

    // Assert
    expect(result).toBeNull()
  })

  it("UTCID03 - overrides an existing key and resets TTL if not provided", async () => {
    // Arrange
    const key = "override-key"
    await service.set(key, "initial-val", 10)

    // Act
    await service.set(key, "new-val")
    const result = await service.get<string>(key)

    // Assert
    expect(result).toBe("new-val")
  })
})

describe("InMemoryCacheService.del", () => {
  let service: InMemoryCacheService

  beforeEach(() => {
    service = new InMemoryCacheService()
  })

  it("UTCID01 - deletes an existing cache entry successfully", async () => {
    // Arrange
    const key = "delete-me"
    await service.set(key, "val")

    // Act
    await service.del(key)
    const result = await service.get(key)

    // Assert
    expect(result).toBeNull()
  })

  it("UTCID02 - does not throw an error when deleting a non-existent key", async () => {
    // Arrange
    const key = "missing-key"

    // Act & Assert
    await expect(service.del(key)).resolves.not.toThrow()
  })

  it("UTCID03 - successfully deletes a key that has a null value", async () => {
    // Arrange
    const key = "null-val-key"
    await service.set(key, null)

    // Act
    await service.del(key)
    const result = await service.get(key)

    // Assert
    expect(result).toBeNull()
  })
})

describe("InMemoryCacheService.clear", () => {
  let service: InMemoryCacheService

  beforeEach(() => {
    service = new InMemoryCacheService()
  })

  it("UTCID01 - clears all cached keys", async () => {
    // Arrange
    await service.set("k1", "v1")
    await service.set("k2", "v2")

    // Act
    await service.clear()
    const r1 = await service.get("k1")
    const r2 = await service.get("k2")

    // Assert
    expect(r1).toBeNull()
    expect(r2).toBeNull()
  })

  it("UTCID02 - works successfully when cache is already empty", async () => {
    // Arrange & Act & Assert
    await expect(service.clear()).resolves.not.toThrow()
  })

  it("UTCID03 - allows setting and getting new keys after clearing", async () => {
    // Arrange
    await service.set("k1", "v1")
    await service.clear()

    // Act
    await service.set("k2", "v2")
    const result = await service.get<string>("k2")

    // Assert
    expect(result).toBe("v2")
  })
})

describe("InMemoryCacheService.subscribe", () => {
  let service: InMemoryCacheService
  let spyOn: jest.SpyInstance

  beforeEach(() => {
    service = new InMemoryCacheService()
    spyOn = jest
      .spyOn(EventEmitter.prototype, "on")
      .mockImplementation((_event: string | symbol, _listener: (...args: unknown[]) => void) => {
        return new EventEmitter()
      })
  })

  afterEach(() => {
    spyOn.mockRestore()
  })

  it("UTCID01 - registers a subscriber callback with the emitter for a channel", async () => {
    // Arrange
    const channel = "notifications"
    const callback = jest.fn()

    // Act
    await service.subscribe(channel, callback)

    // Assert
    expect(spyOn).toHaveBeenCalledWith(channel, callback)
  })

  it("UTCID02 - allows subscribing multiple callbacks to the same channel", async () => {
    // Arrange
    const channel = "notifications"
    const cb1 = jest.fn()
    const cb2 = jest.fn()

    // Act
    await service.subscribe(channel, cb1)
    await service.subscribe(channel, cb2)

    // Assert
    expect(spyOn).toHaveBeenCalledTimes(2)
    expect(spyOn).toHaveBeenNthCalledWith(1, channel, cb1)
    expect(spyOn).toHaveBeenNthCalledWith(2, channel, cb2)
  })

  it("UTCID03 - propagates errors when subscriber register logic fails in mock", async () => {
    // Arrange
    const channel = "notifications"
    const invalidCallback = jest.fn()
    spyOn.mockImplementationOnce(() => {
      throw new Error("Invalid registration")
    })

    // Act & Assert
    await expect(service.subscribe(channel, invalidCallback)).rejects.toThrow(
      "Invalid registration",
    )
  })
})

describe("InMemoryCacheService.publish", () => {
  let service: InMemoryCacheService
  let spyEmit: jest.SpyInstance

  beforeEach(() => {
    service = new InMemoryCacheService()
    spyEmit = jest.spyOn(EventEmitter.prototype, "emit").mockImplementation(() => {
      return true
    })
  })

  afterEach(() => {
    spyEmit.mockRestore()
  })

  it("UTCID01 - emits a message to the specified channel", async () => {
    // Arrange
    const channel = "notifications"
    const message = "hello world"

    // Act
    await service.publish(channel, message)

    // Assert
    expect(spyEmit).toHaveBeenCalledWith(channel, message)
  })

  it("UTCID02 - handles publishing empty/null messages gracefully", async () => {
    // Arrange
    const channel = "notifications"
    const message = null as unknown as string

    // Act
    await service.publish(channel, message)

    // Assert
    expect(spyEmit).toHaveBeenCalledWith(channel, null)
  })

  it("UTCID03 - propagates emitter runtime exceptions if emitter throws", async () => {
    // Arrange
    const channel = "notifications"
    const message = "fail"
    spyEmit.mockImplementationOnce(() => {
      throw new Error("Emit failed")
    })

    // Act & Assert
    await expect(service.publish(channel, message)).rejects.toThrow("Emit failed")
  })
})

describe("createCacheService", () => {
  it("UTCID01 - creates a new instance of InMemoryCacheService", () => {
    // Arrange & Act
    const result = createCacheService()

    // Assert
    expect(result).toBeInstanceOf(InMemoryCacheService)
  })

  it("UTCID02 - returns a fresh, independent instance", async () => {
    // Arrange
    const instance1 = createCacheService()
    const instance2 = createCacheService()

    // Act
    await instance1.set("shared-key", "value1")
    const valIn2 = await instance2.get("shared-key")

    // Assert
    expect(valIn2).toBeNull()
  })

  it("UTCID03 - exports a pre-created default cacheService instance", () => {
    // Arrange & Act & Assert
    expect(cacheService).toBeInstanceOf(InMemoryCacheService)
  })
})
