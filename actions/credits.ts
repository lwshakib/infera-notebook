import { DEFAULT_CREDITS, DEFAULT_CREDIT_DEDUCTION } from '@/lib/constants';
import prisma from '@/lib/prisma';

/**
 * Checks if a user's daily credits should be reset and performs the reset if needed.
 * Credits are reset to DEFAULT_CREDITS at the start of each new day.
 *
 * @param userId - Unique ID of the user.
 * @returns The current (possibly reset) credit count, or null if user not found.
 */
export async function checkAndResetCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, lastCreditReset: true },
  });

  if (!user) return null;

  const now = new Date();
  const lastReset = new Date(user.lastCreditReset);

  // Check if it's a new day (00:00 AM) relative to the last reset
  const isNewDay = now.toDateString() !== lastReset.toDateString();

  if (isNewDay) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: DEFAULT_CREDITS,
        lastCreditReset: now,
      },
      select: { credits: true },
    });
    return updatedUser.credits;
  }

  return user.credits;
}

/**
 * Deducts a fixed amount of credits from the user's balance.
 * Automatically triggers a credit reset if the first request of the day.
 *
 * @param userId - Unique ID of the user.
 * @returns boolean - True if deduction was successful, false if insufficient credits.
 */
export async function deductCredit(userId: string) {
  const currentCredits = await checkAndResetCredits(userId);

  if (currentCredits === null || currentCredits <= 0) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: { decrement: DEFAULT_CREDIT_DEDUCTION },
    },
  });

  return true;
}

export async function getUserCredits(userId: string) {
  const credits = await checkAndResetCredits(userId);
  return credits;
}
