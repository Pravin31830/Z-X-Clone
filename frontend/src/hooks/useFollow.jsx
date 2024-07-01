import {useMutation , useQueryClient} from '@tanstack/react-query'
import {toast} from 'react-hot-toast'

const useFollow=()=>{
    const queryclient = useQueryClient();

    const {mutate:follow,isPending} = useMutation({
        mutationFn: async(userId)=>{
            try {
                const res = await fetch(`/api/users/follow/${userId}`,{
                    method:'POST',
                })

                const data = res.json();

                if (!res.ok){
                    throw new Error(data.error);
                }

                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        onSuccess:()=>{
            Promise.all([
            queryclient.invalidateQueries({queryKey:['suggestedUser']}),
            queryclient.invalidateQueries({queryKey:['authUser']}),
            ])
            toast.success("followed");
        },
        onError:()=>{
            toast.error(error.message)
        }
    })

    return {follow,isPending};
}

export default useFollow;