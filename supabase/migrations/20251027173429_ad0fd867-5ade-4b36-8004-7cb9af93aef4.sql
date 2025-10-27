-- Add moderator permissions to RLS policies

-- Blog posts: Moderators can manage all blog posts
CREATE POLICY "Moderators can manage blog posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Build comments: Moderators can delete inappropriate comments
CREATE POLICY "Moderators can delete any comments"
ON public.build_comments
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Builds: Moderators can view all builds (including private ones)
CREATE POLICY "Moderators can view all builds"
ON public.builds
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Orders: Moderators can view orders (read-only for customer support)
CREATE POLICY "Moderators can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));