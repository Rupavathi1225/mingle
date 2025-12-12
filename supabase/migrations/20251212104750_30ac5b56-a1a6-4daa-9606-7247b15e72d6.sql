-- Add policy to allow deleting email_captures records
CREATE POLICY "Admin delete email_captures" 
ON public.email_captures 
FOR DELETE 
USING (true);