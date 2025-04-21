import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetails from "@/pages/project-details";
import Tasks from "@/pages/tasks";
import Settings from "@/pages/settings";
import Backup from "@/pages/backup";
import Statistics from "@/pages/statistics";
import Pomodoro from "@/pages/pomodoro";
import Timeline from "@/pages/timeline";
import Layout from "@/components/layout/layout";
import TaskWidget from "@/components/widget/task-widget";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/:id" component={ProjectDetails} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/statistics" component={Statistics} />
        <Route path="/timeline" component={Timeline} />
        <Route path="/backup" component={Backup} />
        <Route path="/settings" component={Settings} />
        <Route path="/pomodoro" component={Pomodoro} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <>
      <Router />
      <TaskWidget />
      <Toaster />
    </>
  );
}

export default App;
