import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EmailSettingsForm,
  InviteForm,
  PurgeButton,
  RevokeButton,
} from "@/components/dashboard/settings-client";
import { getCurrentUser } from "@/lib/auth";
import { getEnv } from "@/lib/bindings";
import { resolveEmailConfig } from "@/lib/email-config";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const isOwner = user?.role === "owner";
  const store = await getStore();
  const [users, sessions] = isOwner
    ? await Promise.all([store.listUsers(), store.listSessions()])
    : [[], []];
  const emailConfig = isOwner ? await resolveEmailConfig(await getEnv(), store) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Email: </span>
            {user?.email}
          </p>
          <p>
            <span className="text-muted-foreground">Role: </span>
            <span className="capitalize">{user?.role}</span>
          </p>
        </CardContent>
      </Card>

      {isOwner && emailConfig ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email (Resend)</CardTitle>
          </CardHeader>
          <CardContent>
            <EmailSettingsForm
              initial={{
                configured: emailConfig.apiKey !== null,
                source: emailConfig.source,
                keyHint: emailConfig.keyHint,
                from: emailConfig.from,
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {isOwner ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <InviteForm />
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.last_login_at ? new Date(member.last_login_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {member.role !== "owner" ? (
                            <RevokeButton userId={member.id} label="Remove staff" />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No active sessions
                        </TableCell>
                      </TableRow>
                    ) : (
                      sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.email}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(session.created_at).toLocaleString()}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(session.last_seen_at).toLocaleString()}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(session.expires_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <RevokeButton sessionId={session.id} label="Revoke" />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">System</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- attachment download */}
          <Button variant="outline" render={<a href="/api/subscribers?export=csv" />}>
            Export Subscribers CSV
          </Button>
          {isOwner ? (
            <Button variant="outline" render={<a href="/api/settings/export" />}>
              Export All Data (JSON)
            </Button>
          ) : null}
          {isOwner ? <PurgeButton /> : null}
        </CardContent>
      </Card>
    </div>
  );
}
