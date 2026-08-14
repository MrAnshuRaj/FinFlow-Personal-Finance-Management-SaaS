const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
export type ApiResponse<T> = { success: boolean; data: T; error?: { message: string } };
export const getToken = () => typeof window === "undefined" ? null : localStorage.getItem("finflow_access");
export async function api<T>(path:string, options:RequestInit={}) : Promise<T> {
  const request = (token: string | null) => {
    const headers = new Headers(options.headers);
    headers.set("Content-Type","application/json");
    if (token) headers.set("Authorization",`Bearer ${token}`);
    return fetch(`${base}${path}`,{...options,headers});
  };
  let response = await request(getToken());
  // Rotate an expired access token once. If the refresh session has also gone
  // away (for example after a local database reset), return to sign-in cleanly.
  if (response.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/")) {
    const refreshToken = localStorage.getItem("finflow_refresh");
    if (refreshToken) {
      const refresh = await fetch(`${base}/auth/refresh`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refreshToken})});
      if (refresh.ok) {
        const result = await refresh.json() as ApiResponse<{accessToken:string;refreshToken:string}>;
        localStorage.setItem("finflow_access",result.data.accessToken);
        localStorage.setItem("finflow_refresh",result.data.refreshToken);
        response = await request(result.data.accessToken);
      }
    }
    if (response.status === 401) {
      localStorage.removeItem("finflow_access");
      localStorage.removeItem("finflow_refresh");
      window.location.assign("/login");
      throw new Error("Your session has expired. Please sign in again.");
    }
  }
  if(!response.ok){const body=await response.json().catch(()=>null);throw new Error(body?.error?.message||"Request failed");}
  if(response.status===204)return undefined as T;
  const body:ApiResponse<T>=await response.json();return body.data;
}
export { base };
