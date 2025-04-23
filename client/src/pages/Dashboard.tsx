import { useTitle } from "@/lib/hooks/useTitle";
import DashboardStats from "@/components/dashboard/DashboardStats";
import TodaysSchedule from "@/components/dashboard/TodaysSchedule";
import LowStockMaterials from "@/components/dashboard/LowStockMaterials";
import MonthlyPerformance from "@/components/dashboard/MonthlyPerformance";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Plus, Calendar } from "lucide-react";
import { useAppContext } from "@/lib/context/AppContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Dashboard() {
  useTitle("Dashboard | FieldServe Pro");
  const { user } = useAppContext();

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-800">Dashboard</h2>
        <p className="text-neutral-500 mt-1">Overview of your field service operations</p>
      </div>

      {/* Technician welcome section */}
      <Card className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="md:flex">
          <div className="p-6 md:w-2/3">
            <h3 className="text-xl font-semibold text-neutral-800">
              Welcome back, {user?.name || "Technician"}!
            </h3>
            <p className="mt-2 text-neutral-600">
              You have <span className="font-semibold text-primary-600">5 tasks</span> scheduled for today.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/tasks/new">
                <Button className="flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  New Task
                </Button>
              </Link>
              <Link href="/tasks">
                <Button variant="outline" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  View Schedule
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block md:w-1/3 bg-primary-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full text-primary-100"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <rect width="100%" height="100%" fill="#E6F0FD" />
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                fill="#60A5FA"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <DashboardStats />

      {/* Today's Schedule and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <TodaysSchedule />
        </div>
        
        <div>
          <LowStockMaterials />
          <MonthlyPerformance />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
