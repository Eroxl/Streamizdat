import { useQuery } from "@tanstack/react-query";

const fetchPermissions = async (): Promise<string[]> => {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/permissions`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    if (!response.ok) {
        return [];
    }

    const data = await response.json();
    return data.permissions as string[];
};

const usePermissions = () => {
    return useQuery({
        queryKey: ["permissions"],
        queryFn: fetchPermissions,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const hasPermission = (
    permissions: string[] | undefined,
    requiredPermission: string
): boolean => {
    if (!permissions) return false;
    if (permissions.includes("super_user")) return true;
    return permissions.includes(requiredPermission);
};

export default usePermissions;
