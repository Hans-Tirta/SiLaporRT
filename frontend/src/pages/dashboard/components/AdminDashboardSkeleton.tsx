import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import Skeleton from "../../../components/ui/Skeleton";

export default function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Statistics cards skeleton - same grid as real dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={index}
            className="hover:shadow-md transition-shadow cursor-pointer"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  {/* Title skeleton */}
                  <Skeleton className="h-4 w-24 mb-1" />
                  {/* Value skeleton */}
                  <Skeleton className="h-8 w-12 mb-1" />
                </div>
                <div className="p-3 rounded-full bg-gray-100">
                  <Skeleton className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Overview - same grid as real dashboard */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Status Chart skeleton */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-6 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Donut chart placeholder - mimics actual layout */}
            <div className="flex flex-col lg:flex-row items-center gap-6">
              {/* Donut skeleton */}
              <div className="flex-shrink-0">
                <Skeleton className="h-[200px] w-[200px] rounded-full" />
              </div>
              {/* Legend skeleton */}
              <div className="flex-1 w-full">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="space-y-1 lg:text-left text-center"
                    >
                      <div className="flex items-center space-x-2 lg:justify-start justify-center">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex items-center space-x-1 lg:ml-5 lg:justify-start justify-center">
                        <Skeleton className="h-5 w-8" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Chart skeleton */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-6 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Bar chart placeholder - 2 columns on xl */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-6" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
