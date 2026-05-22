import os
import sys
from dotenv import load_dotenv

# Ensure we can import from backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.agents.analyst_agent import SupplyChainAnalystAgent

def main():
    print("=== MULTIMODAL SUPPLY CHAIN ANALYST AGENT VERIFICATION ===")
    
    # Load .env file
    load_dotenv()
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[-] Verification Error: GEMINI_API_KEY environment variable is missing.")
        print("    Please create a .env file with GEMINI_API_KEY=your_key or export the variable.")
        sys.exit(1)
        
    print("[+] GEMINI_API_KEY configured successfully.")
    
    # Locate messy dataset
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "data", "messy_inventory.csv")
    if not os.path.exists(csv_path):
        print(f"[-] Verification Error: Sample dataset missing at {csv_path}")
        sys.exit(1)
        
    print(f"[+] Sample dataset verified at: {csv_path}")
    
    # Instantiate agent
    print("[*] Initializing SupplyChainAnalystAgent (gemini-1.5-flash)...")
    try:
        agent = SupplyChainAnalystAgent(api_key=api_key)
    except Exception as e:
        print(f"[-] Failed to initialize agent: {str(e)}")
        sys.exit(1)
        
    print("[+] Agent initialized. Starting sandboxed code-generation execution...")
    
    # Execute analysis pipeline
    query = (
        "Perform a complete supply chain audit. Clean Unit_Cost_USD and In_Stock_Quantity columns. "
        "Recommend reorders for any item with In_Stock_Quantity < Reorder_Level. "
        "Save a bar chart showing current In_Stock_Quantity vs Reorder_Level by Product_Name."
    )
    
    result = agent.analyze_data(
        csv_path=csv_path,
        user_query=query,
        max_retries=3
    )
    
    # Inspect outcomes
    if result["success"]:
        print("[+] SUCCESS: Data Analyst Agent finished execution successfully!")
        print("\n=== GENERATED PYTHON CODE ===")
        print(result["code"])
        
        print("\n=== EXECUTION STDOUT LOGS ===")
        print(result["stdout"])
        
        print("\n=== GENERATED CHARTS ===")
        print(result["generated_charts"])
        
        print("\n=== FINAL EXECUTIVE REPORT ===")
        print(result["report"])
        
        print("\n[+] Verification PASSED!")
    else:
        print("[-] FAILURE: Agent failed to execute code properly.")
        print(f"Error: {result.get('error')}")
        print("\n=== EXECUTION HISTORY ===")
        for attempt in result.get("execution_attempts", []):
            print(f"Attempt {attempt.get('attempt')}:")
            print(f"Success: {attempt.get('success')}")
            print(f"Error Log:\n{attempt.get('stderr')}")
        sys.exit(1)

if __name__ == "__main__":
    main()
