import os
import re
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from PIL import Image
import google.generativeai as genai
from backend.sandbox.executor import SandboxExecutor

class SupplyChainAnalystAgent:
    """
    Multimodal AI agent capable of writing, executing, and self-correcting 
    Python pandas/matplotlib code to analyze supply chain datasets and dashboards.
    """
    def __init__(self, api_key: str = None, model_name: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set. Please set it to enable agent capabilities.")
            
        genai.configure(api_key=self.api_key)
        self.model_name = model_name
        self.model = genai.GenerativeModel(model_name)
        self.executor = SandboxExecutor()

    def _extract_python_code(self, response_text: str) -> Optional[str]:
        """
        Extracts python code block from a markdown response.
        """
        match = re.search(r"```python\s*(.*?)\s*```", response_text, re.DOTALL)
        if match:
            return match.group(1).strip()
        # Fallback to general code blocks if python is not explicitly specified
        match_general = re.search(r"```\s*(.*?)\s*```", response_text, re.DOTALL)
        if match_general:
            return match_general.group(1).strip()
        return None

    def analyze_data(
        self, 
        csv_path: Optional[str] = None, 
        image_path: Optional[str] = None, 
        user_query: str = "Analyze this data, clean anomalies, plot key distributions, and provide supply chain insights.",
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Main runner: Coordinates scraping/metadata gathering, code generation,
        sandbox execution, self-correction loop, and final recommendation report.
        """
        # Step 1: Gather file preview and construct multimodal context
        prompt_context = ""
        pil_image = None
        
        # Determine CSV structure and read a small preview
        csv_preview = ""
        dataset_filename = ""
        if csv_path and os.path.exists(csv_path):
            dataset_filename = os.path.basename(csv_path)
            # Copy to sandbox workspace for execution
            shutil_dest = os.path.join(self.executor.workspace_dir, dataset_filename)
            import shutil
            try:
                shutil.copy2(csv_path, shutil_dest)
            except Exception as e:
                pass
                
            try:
                # Read CSV preview to show schema to the agent
                df_preview = pd.read_csv(csv_path, nrows=5)
                csv_preview = f"Columns in CSV: {list(df_preview.columns)}\nPreview (first few rows):\n{df_preview.to_string()}\n"
            except Exception as e:
                csv_preview = f"Could not read CSV preview directly, error: {str(e)}\n"
                
        if image_path and os.path.exists(image_path):
            try:
                pil_image = Image.open(image_path)
                prompt_context += "\n[Dashboard/Visualization Screenshot Uploaded]"
            except Exception as e:
                prompt_context += f"\n[Error opening screenshot: {str(e)}]"

        # Step 2: Formulate initial prompt for code generation
        system_instructions = (
            "You are an expert Data Analyst and Supply Chain Optimization Agent. "
            "You write highly efficient, robust Python code using pandas, numpy, matplotlib, and seaborn. "
            "IMPORTANT: Your response MUST contain a single python code block enclosed in ```python ... ``` tags. "
            "The code should complete the analysis requested by the user, clean all data issues (like '$' symbols, "
            "negative/unrealistic numbers, inconsistent labels or casing, and empty fields), print key summaries to stdout, "
            "and save at least one beautiful data visualization chart as a PNG file in the current working directory.\n\n"
            "Rules for writing code:\n"
            "- Always handle missing values, malformed price tags (e.g. convert '$12.00' or 'Unknown' to float numeric values), "
            "and categorical casing issues ('electronics' vs 'Electronics').\n"
            f"- If a CSV file is provided, read it directly as: df = pd.read_csv('{dataset_filename}')\n"
            "- Always call plt.tight_layout() and save plots to current directory as a PNG file, e.g. plt.savefig('inventory_distribution.png', dpi=150)\n"
            "- Make sure you DO NOT show or display the chart with plt.show() (always save it and close plt.close() to prevent blocking in headless systems).\n"
            "- Print insightful markdown-formatted statistics and findings to standard output during execution using print().\n"
        )
        
        prompt = (
            f"Here is the context of the files uploaded:\n"
            f"{csv_preview}\n"
            f"User Goal: {user_query}\n\n"
            "Generate the Python script to analyze this data. Clean anomalies, compute standard supply chain metrics "
            "(e.g., Stock status, Reorder Recommendations, Lead times, or holding cost estimation), print the markdown summary, "
            "and save a beautiful visualization plot."
        )

        # Generate code from Gemini
        execution_attempts = []
        code = None
        current_prompt = prompt
        
        for attempt in range(1, max_retries + 1):
            # Form Gemini API Input content list
            contents = [system_instructions, current_prompt]
            if pil_image:
                contents.append(pil_image)
                
            try:
                response = self.model.generate_content(contents)
                response_text = response.text
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Error communicating with Gemini: {str(e)}",
                    "execution_attempts": execution_attempts
                }
                
            code = self._extract_python_code(response_text)
            if not code:
                execution_attempts.append({
                    "attempt": attempt,
                    "code_generated": False,
                    "raw_response": response_text,
                    "error": "No Python code block found in Gemini's response."
                })
                current_prompt = "Your previous response did not include a valid code block wrapped in ```python and ```. Please provide a valid code block."
                continue
                
            # Execute code inside Sandbox
            exec_res = self.executor.execute_code(code)
            exec_res["attempt"] = attempt
            exec_res["code"] = code
            execution_attempts.append(exec_res)
            
            if exec_res["success"]:
                # Success! Break the self-correction loop
                break
            else:
                # Code execution failed, prepare correction prompt for next attempt
                error_traceback = exec_res["stderr"] or exec_res["stdout"]
                current_prompt = (
                    f"The Python script you generated failed with the following traceback during execution:\n"
                    f"```\n{error_traceback}\n```\n\n"
                    f"Here was the code you wrote:\n"
                    f"```python\n{code}\n```\n\n"
                    "Please review the error and output logs, identify the root cause (e.g. wrong columns, data type conversions, "
                    "or division by zero), and rewrite a fully self-corrected, working Python script."
                )

        # Analyze final results or fallback
        final_attempt = execution_attempts[-1]
        if not final_attempt.get("success"):
            return {
                "success": False,
                "error": "Failed to generate running Python code within retry limits.",
                "execution_attempts": execution_attempts
            }

        # Step 3: Synthesis - Send stdout back to Gemini to synthesize strategic findings
        stdout_logs = final_attempt["stdout"]
        synthesis_prompt = (
            f"You have successfully executed a Python analysis script on the supply chain dataset.\n"
            f"Here is the standard output (results/statistics) printed by the code:\n"
            f"```\n{stdout_logs}\n```\n\n"
            f"Here is the user query: {user_query}\n\n"
            "Please provide a final premium supply chain analysis report based strictly on the execution results. "
            "Format the report using clean markdown, structured headers, and bullets. The report must contain:\n"
            "1. **Executive Summary:** A high-level overview of the findings.\n"
            "2. **Data Anomalies Handled:** Explain what raw data cleanups/transformations were made by your code.\n"
            "3. **Key Supply Chain Insights:** In-depth evaluation (e.g., stock shortages, excessive holdings, supplier lead-time issues).\n"
            "4. **Strategic Recommendations:** Actionable tactical instructions for warehouse and operations management (e.g., reorder quantities, suppliers to renegotiate, category adjustments).\n"
            "Do NOT include the Python code in your final report, just the strategic business insights."
        )

        try:
            synthesis_response = self.model.generate_content([system_instructions, synthesis_prompt])
            report = synthesis_response.text
        except Exception as e:
            report = f"Execution succeeded, but synthesis failed: {str(e)}\n\nRaw Execution Log:\n{stdout_logs}"

        return {
            "success": True,
            "code": final_attempt["code"],
            "stdout": final_attempt["stdout"],
            "generated_charts": final_attempt["generated_charts"],
            "report": report,
            "execution_attempts": execution_attempts
        }
