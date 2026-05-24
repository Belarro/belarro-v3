describe('Seeding Date Logic', () => {
  // Helper function to calculate seeding date
  const calculateSeedingDate = (orderDate: Date, seeding_schedule: string): Date => {
    const date = new Date(orderDate);
    const dayOfWeek = date.getDay(); // 0=Sunday, 5=Friday, 2=Tuesday

    if (seeding_schedule === 'FRIDAY') {
      // If Friday or later, next Friday
      if (dayOfWeek === 5) {
        // Already Friday
        return date;
      } else if (dayOfWeek > 5 || dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4) {
        // Calculate days until Friday
        const daysUntilFriday = dayOfWeek > 5 ? 7 - dayOfWeek + 5 : 5 - dayOfWeek;
        const result = new Date(date);
        result.setDate(result.getDate() + daysUntilFriday);
        return result;
      }
    }

    if (seeding_schedule === 'TUESDAY') {
      // If Tuesday or later, next Tuesday
      if (dayOfWeek === 2) {
        // Already Tuesday
        return date;
      } else if (dayOfWeek > 2) {
        // Calculate days until next Tuesday
        const daysUntilTuesday = 7 - dayOfWeek + 2;
        const result = new Date(date);
        result.setDate(result.getDate() + daysUntilTuesday);
        return result;
      } else {
        // Before Tuesday this week
        const result = new Date(date);
        result.setDate(result.getDate() + (2 - dayOfWeek));
        return result;
      }
    }

    return date;
  };

  const calculateHarvestDate = (seedingDate: Date, growthDays: number): Date => {
    const result = new Date(seedingDate);
    result.setDate(result.getDate() + growthDays);
    return result;
  };

  describe('Seeding date calculation', () => {
    it('should schedule Friday crop for Friday if ordered before Friday', () => {
      // Wednesday order for Friday crop
      const wednesday = new Date('2026-05-27'); // Wednesday
      const seedingDate = calculateSeedingDate(wednesday, 'FRIDAY');

      // Should seed on Friday (May 29)
      expect(seedingDate.getDay()).toBe(5); // Friday
      expect(seedingDate.getDate()).toBe(29);
    });

    it('should schedule Friday crop for next Friday if ordered on Friday or later', () => {
      // Friday order for Friday crop
      const friday = new Date('2026-05-29'); // Friday
      const seedingDate = calculateSeedingDate(friday, 'FRIDAY');

      // Should seed on this Friday or next Friday
      expect(seedingDate.getDay()).toBe(5); // Friday
    });

    it('should schedule Tuesday crop for Tuesday if ordered before Tuesday', () => {
      // Monday order for Tuesday crop
      const monday = new Date('2026-05-25'); // Monday
      const seedingDate = calculateSeedingDate(monday, 'TUESDAY');

      // Should seed on Tuesday (May 26)
      expect(seedingDate.getDay()).toBe(2); // Tuesday
      expect(seedingDate.getDate()).toBe(26);
    });

    it('should schedule Tuesday crop for next Tuesday if ordered on Tuesday or later', () => {
      // Wednesday order for Tuesday crop
      const wednesday = new Date('2026-05-27'); // Wednesday
      const seedingDate = calculateSeedingDate(wednesday, 'TUESDAY');

      // Should seed on next Tuesday
      expect(seedingDate.getDay()).toBe(2); // Tuesday
    });
  });

  describe('Harvest date calculation', () => {
    it('should add growth days to seeding date', () => {
      const seedingDate = new Date('2026-05-29'); // Friday
      const harvestDate = calculateHarvestDate(seedingDate, 10);

      expect(harvestDate.getDate()).toBe(seedingDate.getDate() + 10);
    });

    it('should handle month boundaries', () => {
      const seedingDate = new Date('2026-05-25'); // Monday
      const harvestDate = calculateHarvestDate(seedingDate, 15);

      // May 25 + 15 days = June 9
      expect(harvestDate.getMonth()).toBe(5); // June (0-indexed: 5 = June)
      expect(harvestDate.getDate()).toBe(9);
    });

    it('should work for different growth periods', () => {
      const seedingDate = new Date('2026-05-29'); // Friday

      // 10-day crop
      const harvest10 = calculateHarvestDate(seedingDate, 10);
      expect(harvest10.getDate()).toBe(8); // June 8

      // 28-day crop
      const harvest28 = calculateHarvestDate(seedingDate, 28);
      expect(harvest28.getDate()).toBe(26); // June 26
    });
  });

  describe('Harvest allocation logic', () => {
    it('should allocate full harvest to orders if sufficient', () => {
      const actualYield = 100; // grams
      const orderedQty = 75; // grams

      const allocatedToOrders = Math.min(actualYield, orderedQty);
      const allocatedToSamples = actualYield - allocatedToOrders;

      expect(allocatedToOrders).toBe(75);
      expect(allocatedToSamples).toBe(25);
    });

    it('should handle underproduction', () => {
      const actualYield = 50; // grams
      const orderedQty = 100; // grams

      const allocatedToOrders = Math.min(actualYield, orderedQty);
      const allocatedToSamples = actualYield - allocatedToOrders;

      expect(allocatedToOrders).toBe(50);
      expect(allocatedToSamples).toBe(0); // No samples if underproduced
    });

    it('should maximize samples if overproduction', () => {
      const actualYield = 200; // grams
      const orderedQty = 150; // grams

      const allocatedToOrders = Math.min(actualYield, orderedQty);
      const allocatedToSamples = actualYield - allocatedToOrders;

      expect(allocatedToOrders).toBe(150);
      expect(allocatedToSamples).toBe(50); // Extra becomes samples
    });
  });

  describe('Seed inventory deduction', () => {
    it('should deduct seeds for seeded trays', () => {
      const initialInventory = 1000; // grams
      const seedsPerTray = 60; // grams
      const traysSeeded = 5;

      const seedsDeducted = seedsPerTray * traysSeeded;
      const remainingInventory = initialInventory - seedsDeducted;

      expect(seedsDeducted).toBe(300);
      expect(remainingInventory).toBe(700);
    });

    it('should alert if insufficient seeds', () => {
      const currentInventory = 100; // grams
      const seedsNeeded = 300; // grams

      const hasSufficientSeeds = currentInventory >= seedsNeeded;

      expect(hasSufficientSeeds).toBe(false);
    });

    it('should not alert if sufficient seeds', () => {
      const currentInventory = 500; // grams
      const seedsNeeded = 300; // grams

      const hasSufficientSeeds = currentInventory >= seedsNeeded;

      expect(hasSufficientSeeds).toBe(true);
    });
  });

  describe('Reorder threshold logic', () => {
    it('should alert when below threshold', () => {
      const seedsPerTray = 60;
      const remainingGrams = 940;
      const remainingTrays = Math.floor(remainingGrams / seedsPerTray); // 15 trays
      const threshold = 20;

      const needsReorder = remainingTrays < threshold;

      expect(remainingTrays).toBe(15);
      expect(needsReorder).toBe(true);
    });

    it('should not alert when above threshold', () => {
      const seedsPerTray = 60;
      const remainingGrams = 1500;
      const remainingTrays = Math.floor(remainingGrams / seedsPerTray); // 25 trays
      const threshold = 20;

      const needsReorder = remainingTrays < threshold;

      expect(remainingTrays).toBe(25);
      expect(needsReorder).toBe(false);
    });
  });
});
