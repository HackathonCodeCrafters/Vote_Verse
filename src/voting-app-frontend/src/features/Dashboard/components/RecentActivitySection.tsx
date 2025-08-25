import { TrendingUp, Users, Vote } from "lucide-react";

interface RecentActivityProps {
  darkMode?: boolean;
}

const recentActivity = [
  {
    action: "Voted Yes",
    proposal: "Increase Block Reward",
    time: "2 hours ago",
    type: "vote",
  },
  {
    action: "Created Proposal",
    proposal: "New Staking Mechanism",
    time: "1 day ago",
    type: "create",
  },
  {
    action: "Voted No",
    proposal: "Fee Structure Change",
    time: "2 days ago",
    type: "vote",
  },
  {
    action: "Delegated VP",
    proposal: "To CoreDev Team",
    time: "3 days ago",
    type: "delegate",
  },
];

export default function RecentActivitySection({
  darkMode = false,
}: RecentActivityProps) {
  return (
    <div className="rounded-2xl border backdrop-blur-sm bg-gray-800/50 border-gray-700 hover:bg-gray-800/70  p-4">
      <h2
        className={`text-2xl font-bold mb-6 ${
          darkMode ? "text-white" : "text-gray-900"
        }`}
      >
        Recent Activity
      </h2>
      <div>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-start justify-center space-x-3 rounded-2xl border backdrop-blur-sm bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 p-4"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === "vote"
                    ? "bg-green-100 text-green-600"
                    : activity.type === "create"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {activity.type === "vote" ? (
                  <Vote size={16} />
                ) : activity.type === "create" ? (
                  <TrendingUp size={16} />
                ) : (
                  <Users size={16} />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {activity.action}
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {activity.proposal}
                </p>
                <p
                  className={`text-xs ${
                    darkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
